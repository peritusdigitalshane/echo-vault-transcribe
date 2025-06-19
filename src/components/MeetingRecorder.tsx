
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Phone, VideoIcon, Square, Play, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMeetingRecorder } from '@/hooks/useMeetingRecorder';
import { transcribeAudio } from '@/services/transcriptionService';

interface MeetingRecorderProps {
  onRecordingComplete?: (transcription: any) => void;
}

const MeetingRecorder = ({ onRecordingComplete }: MeetingRecorderProps) => {
  const [recordMicrophone, setRecordMicrophone] = useState(true);
  const [recordSystemAudio, setRecordSystemAudio] = useState(false);
  const [audioQuality, setAudioQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [recordingTitle, setRecordingTitle] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const { toast } = useToast();
  const {
    isRecording,
    recordingState,
    startMeetingRecording,
    stopMeetingRecording,
    error
  } = useMeetingRecorder();

  const handleStartRecording = async () => {
    if (!recordMicrophone && !recordSystemAudio) {
      toast({
        title: "Configuration Error",
        description: "Please enable at least one audio source (microphone or system audio).",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting meeting recording with config:', {
      recordMicrophone,
      recordSystemAudio,
      audioQuality
    });

    const success = await startMeetingRecording({
      recordMicrophone,
      recordSystemAudio,
      audioQuality
    });

    if (success) {
      toast({
        title: "Recording Started",
        description: `Meeting recording is active with ${recordMicrophone ? 'microphone' : ''} ${recordMicrophone && recordSystemAudio ? 'and ' : ''} ${recordSystemAudio ? 'system audio' : ''}.`,
      });
    } else {
      toast({
        title: "Recording Failed", 
        description: error || "Failed to start meeting recording. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    console.log('Stopping meeting recording...');
    setIsTranscribing(true);
    
    try {
      const audioBlob = await stopMeetingRecording();
      
      if (audioBlob && audioBlob.size > 0) {
        console.log('Audio blob received, size:', audioBlob.size);
        
        toast({
          title: "Recording Stopped",
          description: "Processing meeting audio for transcription...",
        });

        const title = recordingTitle.trim() || `Meeting Recording ${new Date().toLocaleString()}`;
        console.log('Starting transcription with title:', title);
        
        const result = await transcribeAudio(audioBlob, title, 'meeting');
        console.log('Transcription result:', result);

        if (result.success) {
          toast({
            title: "Meeting Transcribed",
            description: "Your meeting recording has been transcribed successfully.",
          });
          
          if (onRecordingComplete) {
            onRecordingComplete(result);
          }
          
          setRecordingTitle('');
        } else {
          console.error('Transcription failed:', result.error);
          toast({
            title: "Transcription Failed",
            description: result.error || "Failed to transcribe meeting audio.",
            variant: "destructive",
          });
        }
      } else {
        console.error('No audio data recorded');
        toast({
          title: "No Recording Found",
          description: "No audio data was recorded during the meeting.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Meeting recording error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process meeting recording.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Phone className="h-5 w-5 mr-2 text-primary" />
          Meeting & Call Recorder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recording Configuration */}
        {!isRecording && !isTranscribing && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meetingTitle">Recording Title (Optional)</Label>
              <Input
                id="meetingTitle"
                placeholder="Enter meeting or call title..."
                value={recordingTitle}
                onChange={(e) => setRecordingTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Audio Sources</Label>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mic className="h-4 w-4" />
                    <Label htmlFor="microphone">Microphone (Your Voice)</Label>
                  </div>
                  <Switch
                    id="microphone"
                    checked={recordMicrophone}
                    onCheckedChange={setRecordMicrophone}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <VideoIcon className="h-4 w-4" />
                    <Label htmlFor="system">System Audio (Other Participants)</Label>
                  </div>
                  <Switch
                    id="system"
                    checked={recordSystemAudio}
                    onCheckedChange={setRecordSystemAudio}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Audio Quality</Label>
                <Select value={audioQuality} onValueChange={(value: 'low' | 'medium' | 'high') => setAudioQuality(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (16kHz, 64kbps)</SelectItem>
                    <SelectItem value="medium">Medium (44kHz, 128kbps)</SelectItem>
                    <SelectItem value="high">High (48kHz, 192kbps)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Recording Instructions:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>For video calls:</strong> Enable "System Audio" to capture other participants</li>
                    <li><strong>For phone calls:</strong> Use speakerphone and enable microphone only</li>
                    <li><strong>Note:</strong> System audio capture may not work on all browsers/devices</li>
                    <li>Ensure you have permission to record all participants</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recording Controls */}
        <div className="flex items-center justify-center py-6">
          {!isRecording && !isTranscribing ? (
            <Button
              onClick={handleStartRecording}
              size="lg"
              className="rounded-full h-20 w-20 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              <Play className="h-8 w-8" />
            </Button>
          ) : (
            <Button
              onClick={handleStopRecording}
              size="lg"
              disabled={isTranscribing}
              className="rounded-full h-20 w-20 bg-gray-600 hover:bg-gray-700"
            >
              <Square className="h-8 w-8" />
            </Button>
          )}
        </div>

        {/* Recording Status */}
        {isRecording && (
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-red-600">Recording in Progress</span>
            </div>
            
            <div className="flex justify-center space-x-4">
              {recordingState.hasMicrophone && (
                <Badge className="bg-green-600">
                  <Mic className="h-3 w-3 mr-1" />
                  Microphone Active
                </Badge>
              )}
              {recordingState.hasSystemAudio && (
                <Badge className="bg-blue-600">
                  <VideoIcon className="h-3 w-3 mr-1" />
                  System Audio Active
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Processing Status */}
        {isTranscribing && (
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">
              Processing meeting audio for transcription...
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MeetingRecorder;
