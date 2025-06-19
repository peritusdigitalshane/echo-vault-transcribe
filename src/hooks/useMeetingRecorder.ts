
import { useState, useRef, useCallback } from 'react';
import { MeetingRecorder, MeetingRecorderOptions } from '@/services/meetingRecorderService';

interface MeetingRecorderHook {
  isRecording: boolean;
  recordingState: {
    hasMicrophone: boolean;
    hasSystemAudio: boolean;
  };
  startMeetingRecording: (options: MeetingRecorderOptions) => Promise<boolean>;
  stopMeetingRecording: () => Promise<Blob | null>;
  error: string | null;
}

export const useMeetingRecorder = (): MeetingRecorderHook => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingState, setRecordingState] = useState({
    hasMicrophone: false,
    hasSystemAudio: false
  });
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MeetingRecorder | null>(null);

  const startMeetingRecording = useCallback(async (options: MeetingRecorderOptions): Promise<boolean> => {
    try {
      setError(null);
      recorderRef.current = new MeetingRecorder(options);
      
      const result = await recorderRef.current.startRecording();
      
      if (result.success) {
        setIsRecording(true);
        setRecordingState(recorderRef.current.getRecordingState());
        return true;
      } else {
        setError(result.error || 'Failed to start recording');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start recording');
      return false;
    }
  }, []);

  const stopMeetingRecording = useCallback(async (): Promise<Blob | null> => {
    if (!recorderRef.current) {
      return null;
    }

    try {
      const audioBlob = await recorderRef.current.stopRecording();
      setIsRecording(false);
      setRecordingState({ hasMicrophone: false, hasSystemAudio: false });
      recorderRef.current = null;
      return audioBlob;
    } catch (err: any) {
      setError(err.message || 'Failed to stop recording');
      return null;
    }
  }, []);

  return {
    isRecording,
    recordingState,
    startMeetingRecording,
    stopMeetingRecording,
    error
  };
};
