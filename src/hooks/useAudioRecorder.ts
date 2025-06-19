
import { useState, useRef, useCallback } from 'react';

interface AudioRecorderHook {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  audioLevel: number;
}

export const useAudioRecorder = (): AudioRecorderHook => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    console.log('useAudioRecorder: startRecording called');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      streamRef.current = stream;
      
      // Set up audio analyzer for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      analyzerRef.current = analyzer;

      // Start level monitoring
      const updateAudioLevel = () => {
        if (analyzerRef.current && mediaRecorderRef.current?.state === 'recording') {
          const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
          analyzerRef.current.getByteFrequencyData(dataArray);
          const level = Math.max(...dataArray) / 255;
          setAudioLevel(level);
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      console.log('useAudioRecorder: Recording started successfully, isRecording set to true');
      console.log('useAudioRecorder: MediaRecorder state:', mediaRecorder.state);
      
      // Start audio level monitoring after setting isRecording to true
      updateAudioLevel();
    } catch (error) {
      console.error('useAudioRecorder: Error starting recording:', error);
      throw error;
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    console.log('useAudioRecorder: stopRecording called');
    console.log('useAudioRecorder: Current isRecording state:', isRecording);
    console.log('useAudioRecorder: MediaRecorder exists:', !!mediaRecorderRef.current);
    console.log('useAudioRecorder: MediaRecorder state:', mediaRecorderRef.current?.state);
    
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        console.log('useAudioRecorder: MediaRecorder is recording, proceeding to stop');
        mediaRecorderRef.current.onstop = () => {
          console.log('useAudioRecorder: MediaRecorder stopped event fired');
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log('useAudioRecorder: Created audio blob, size:', audioBlob.size);
          
          // Clean up
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
              console.log('useAudioRecorder: Stopping track:', track.kind);
              track.stop();
            });
            streamRef.current = null;
          }
          
          setAudioLevel(0);
          setIsRecording(false);
          console.log('useAudioRecorder: Cleanup completed, isRecording set to false');
          
          resolve(audioBlob);
        };
        
        console.log('useAudioRecorder: Calling MediaRecorder.stop()');
        mediaRecorderRef.current.stop();
      } else {
        console.log('useAudioRecorder: Cannot stop - MediaRecorder not recording');
        console.log('useAudioRecorder: MediaRecorder exists:', !!mediaRecorderRef.current);
        console.log('useAudioRecorder: MediaRecorder state:', mediaRecorderRef.current?.state);
        setIsRecording(false);
        resolve(null);
      }
    });
  }, []);

  // Add diagnostic logging for state changes
  console.log('useAudioRecorder: Hook render - isRecording:', isRecording);

  return {
    isRecording,
    startRecording,
    stopRecording,
    audioLevel,
  };
};
