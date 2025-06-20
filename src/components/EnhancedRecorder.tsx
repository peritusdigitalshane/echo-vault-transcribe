
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mic, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { transcribeAudio } from "@/services/transcriptionService";

interface EnhancedRecorderProps {
  onTranscriptionComplete: () => void;
}

const EnhancedRecorder = ({ onTranscriptionComplete }: EnhancedRecorderProps) => {
  const [recordingTitle, setRecordingTitle] = useState("");
  const [recordIncomingAudio, setRecordIncomingAudio] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { isRecording, startRecording, stopRecording, audioLevel } = useAudioRecorder();
  const { toast } = useToast();

  const handleStartRecording = async () => {
    try {
      await startRecording(recordIncomingAudio);
      toast({
        title: "Recording Started",
        description: recordIncomingAudio 
          ? "Recording incoming audio through earphones/speakers. Speak near your device."
          : "Recording microphone input. Click Stop to finish.",
      });
    } catch (error: any) {
      console.error('Recording start error:', error);
      toast({
        title: "Recording Failed",
        description: error.message || "Failed to start recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsTranscribing(true);
      const audioBlob = await stopRecording();
      
      if (audioBlob) {
        toast({
          title: "Recording Stopped", 
          description: "Processing your audio for transcription...",
        });

        const title = recordingTitle.trim() || `Recording ${new Date().toLocaleString()}`;
        const result = await transcribeAudio(audioBlob, title);

        if (result.success) {
          toast({
            title: "Transcription Complete",
            description: "Your recording has been transcribed successfully.",
          });
          setRecordingTitle("");
          onTranscriptionComplete();
        } else {
          toast({
            title: "Transcription Failed",
            description: result.error || "Failed to transcribe audio.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "No Recording Found",
          description: "No audio data was recorded.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Recording stop error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process recording.",
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
          <Mic className="h-5 w-5 mr-2 text-primary" />
          Record Meeting
        </CardTitle>
        <CardDescription>
          Start recording your meeting or conversation with advanced options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isRecording && !isTranscribing && (
          <>
            <div className="space-y-2">
              <Label htmlFor="recordingTitle">Recording Title (Optional)</Label>
              <Input
                id="recordingTitle"
                placeholder="Enter a title for your recording..."
                value={recordingTitle}
                onChange={(e) => setRecordingTitle(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="recordIncomingAudio"
                checked={recordIncomingAudio}
                onCheckedChange={(checked) => setRecordIncomingAudio(checked as boolean)}
              />
              <Label htmlFor="recordIncomingAudio" className="text-sm">
                Record incoming audio (for recording through earphones/speakers)
              </Label>
            </div>
            
            {recordIncomingAudio && (
              <div className="p-3 bg-blue-100 border border-blue-400 rounded-md text-blue-800 text-sm">
                <strong>Note:</strong> This mode will disable echo cancellation and noise suppression to capture audio from your earphones or speakers. Make sure your device volume is at an appropriate level.
              </div>
            )}
          </>
        )}
        
        <div className="flex items-center justify-center py-8 space-x-4">
          <Button
            onClick={handleStartRecording}
            size="lg"
            disabled={isRecording || isTranscribing}
            className={`rounded-full h-24 w-24 ${
              isRecording || isTranscribing
                ? "bg-gray-600"
                : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            }`}
          >
            <Mic className="h-8 w-8" />
          </Button>
          
          <Button
            onClick={handleStopRecording}
            size="lg"
            disabled={!isRecording || isTranscribing}
            className={`rounded-full h-24 w-24 ${
              !isRecording || isTranscribing
                ? "bg-gray-600"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            <Square className="h-8 w-8" />
          </Button>
        </div>
        
        {isRecording && (
          <div className="text-center">
            <div 
              className="mx-auto w-12 h-12 rounded-full border-4 border-red-500 mb-2"
              style={{
                transform: `scale(${1 + audioLevel * 0.3})`,
                opacity: 0.6,
                transition: 'transform 0.1s ease-out'
              }}
            />
            <p className="text-sm text-muted-foreground">
              Recording in progress... Audio level: {Math.round(audioLevel * 100)}%
            </p>
            {recordIncomingAudio && (
              <p className="text-xs text-blue-600 mt-1">
                Capturing incoming audio mode
              </p>
            )}
          </div>
        )}
        
        {isTranscribing && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">
              Processing audio for transcription...
            </p>
          </div>
        )}
        
        {!isRecording && !isTranscribing && (
          <p className="text-center text-sm text-muted-foreground">
            Click Start to begin recording, then Stop when finished
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedRecorder;
