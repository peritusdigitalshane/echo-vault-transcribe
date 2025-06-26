
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  Square, 
  Loader2 
} from "lucide-react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { transcribeAudio } from "@/services/transcriptionService";
import { useToast } from "@/hooks/use-toast";

interface AudioRecorderProps {
  onClose?: () => void;
}

const AudioRecorder = ({ onClose }: AudioRecorderProps) => {
  const [title, setTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { isRecording, startRecording, stopRecording, audioLevel } = useAudioRecorder();
  const { toast } = useToast();

  const handleStartRecording = async () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your recording.",
        variant: "destructive",
      });
      return;
    }

    try {
      await startRecording();
      toast({
        title: "Recording Started",
        description: "Speak clearly into your microphone.",
      });
    } catch (error: any) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Failed",
        description: error.message || "Failed to start recording.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsProcessing(true);
      const audioBlob = await stopRecording();
      
      if (audioBlob) {
        const result = await transcribeAudio(audioBlob, title);
        
        if (result.success) {
          toast({
            title: "Note Transcribed",
            description: "Your voice note has been successfully transcribed and saved.",
          });
        } else {
          throw new Error(result.error);
        }
      }
    } catch (error: any) {
      console.error('Error processing recording:', error);
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process recording.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      onClose?.();
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <label htmlFor="note-title" className="block text-sm font-medium mb-2">
          Note Title *
        </label>
        <Input
          id="note-title"
          placeholder="Enter note title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
            <Mic className="h-4 w-4 mr-2" />
            Start Recording
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
    </div>
  );
};

export default AudioRecorder;
