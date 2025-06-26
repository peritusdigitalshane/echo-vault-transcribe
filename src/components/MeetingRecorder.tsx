
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Square, 
  Loader2 
} from "lucide-react";
import { useMeetingRecorder } from "@/hooks/useMeetingRecorder";
import { transcribeMeeting } from "@/services/meetingTranscriptionService";
import { useToast } from "@/hooks/use-toast";

interface MeetingRecorderProps {
  onClose?: () => void;
}

const MeetingRecorder = ({ onClose }: MeetingRecorderProps) => {
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { isRecording, startRecording, stopRecording, audioLevel } = useMeetingRecorder();
  const { toast } = useToast();

  const handleStartRecording = async () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your meeting recording.",
        variant: "destructive",
      });
      return;
    }

    try {
      await startRecording();
      toast({
        title: "Meeting Recording Started",
        description: "Recording system audio. Make sure to share your screen or audio in your meeting app.",
      });
    } catch (error: any) {
      console.error('Error starting meeting recording:', error);
      toast({
        title: "Recording Failed",
        description: error.message || "Failed to start meeting recording.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsProcessing(true);
      const audioBlob = await stopRecording();
      
      if (audioBlob) {
        const participantsList = participants
          .split(',')
          .map(p => p.trim())
          .filter(p => p.length > 0);

        const result = await transcribeMeeting(audioBlob, title, participantsList);
        
        if (result.success) {
          toast({
            title: "Meeting Transcribed",
            description: "Your meeting has been successfully transcribed and saved.",
          });
        } else {
          throw new Error(result.error);
        }
      }
    } catch (error: any) {
      console.error('Error processing meeting recording:', error);
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process meeting recording.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      onClose?.();
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center space-x-2">
        <Video className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Record Meeting</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="meeting-title" className="block text-sm font-medium mb-2">
            Meeting Title *
          </label>
          <Input
            id="meeting-title"
            placeholder="Enter meeting title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isRecording || isProcessing}
          />
        </div>

        <div>
          <label htmlFor="participants" className="block text-sm font-medium mb-2">
            Participants (optional)
          </label>
          <Input
            id="participants"
            placeholder="Enter participant names separated by commas..."
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            disabled={isRecording || isProcessing}
          />
        </div>

        {isRecording && (
          <div className="flex items-center space-x-2">
            <Badge variant="destructive" className="animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              Recording
            </Badge>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-100"
                style={{ width: `${audioLevel * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          {!isRecording ? (
            <Button 
              onClick={handleStartRecording}
              disabled={isProcessing}
              className="flex-1"
            >
              <Video className="h-4 w-4 mr-2" />
              Start Meeting Recording
            </Button>
          ) : (
            <Button 
              onClick={handleStopRecording}
              disabled={isProcessing}
              variant="destructive"
              className="flex-1"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Square className="h-4 w-4 mr-2" />
              )}
              {isProcessing ? 'Processing...' : 'Stop & Transcribe'}
            </Button>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          This will record system audio from your meeting. Make sure to share your screen or enable audio sharing in your video conferencing app.
        </p>
      </div>
    </div>
  );
};

export default MeetingRecorder;
