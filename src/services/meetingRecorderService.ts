
export interface MeetingRecorderOptions {
  recordSystemAudio: boolean;
  recordMicrophone: boolean;
  audioQuality: 'low' | 'medium' | 'high';
}

export interface MeetingRecorderResult {
  success: boolean;
  recordingId?: string;
  error?: string;
}

export class MeetingRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private micStream: MediaStream | null = null;
  private systemStream: MediaStream | null = null;
  private mixedStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private audioContext: AudioContext | null = null;

  constructor(private options: MeetingRecorderOptions) {}

  async startRecording(): Promise<MeetingRecorderResult> {
    try {
      this.audioChunks = [];
      
      // Create audio context for mixing
      this.audioContext = new AudioContext({
        sampleRate: this.getAudioQuality().sampleRate
      });

      const destination = this.audioContext.createMediaStreamDestination();
      
      // Get microphone stream if requested
      if (this.options.recordMicrophone) {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: this.getAudioQuality().sampleRate,
            channelCount: 2
          }
        });

        const micSource = this.audioContext.createMediaStreamSource(this.micStream);
        micSource.connect(destination);
      }

      // Get system audio if requested (for desktop/meeting apps)
      if (this.options.recordSystemAudio) {
        try {
          // Try to get system audio using getDisplayMedia with audio
          this.systemStream = await navigator.mediaDevices.getDisplayMedia({
            video: false,
            audio: {
              sampleRate: this.getAudioQuality().sampleRate,
              channelCount: 2,
              autoGainControl: false,
              echoCancellation: false,
              noiseSuppression: false
            }
          });

          const systemSource = this.audioContext.createMediaStreamSource(this.systemStream);
          systemSource.connect(destination);
        } catch (error) {
          console.warn('System audio capture not available:', error);
          // Continue with just microphone if system audio fails
        }
      }

      this.mixedStream = destination.stream;

      // Create MediaRecorder with the mixed stream
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.mixedStream, {
        mimeType,
        audioBitsPerSecond: this.getAudioQuality().bitrate
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;

      return {
        success: true,
        recordingId: `meeting_${Date.now()}`
      };

    } catch (error: any) {
      console.error('Failed to start meeting recording:', error);
      this.cleanup();
      
      return {
        success: false,
        error: error.message || 'Failed to start recording'
      };
    }
  }

  async stopRecording(): Promise<Blob | null> {
    if (!this.mediaRecorder || !this.isRecording) {
      return null;
    }

    return new Promise((resolve) => {
      if (this.mediaRecorder) {
        this.mediaRecorder.onstop = () => {
          const mimeType = this.getSupportedMimeType();
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });
          this.cleanup();
          resolve(audioBlob);
        };

        this.mediaRecorder.stop();
        this.isRecording = false;
      } else {
        resolve(null);
      }
    });
  }

  private cleanup() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }

    if (this.systemStream) {
      this.systemStream.getTracks().forEach(track => track.stop());
      this.systemStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.mixedStream = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }

  private getAudioQuality() {
    const qualities = {
      low: { sampleRate: 16000, bitrate: 64000 },
      medium: { sampleRate: 44100, bitrate: 128000 },
      high: { sampleRate: 48000, bitrate: 192000 }
    };

    return qualities[this.options.audioQuality];
  }

  getRecordingState() {
    return {
      isRecording: this.isRecording,
      hasMicrophone: !!this.micStream,
      hasSystemAudio: !!this.systemStream
    };
  }
}
