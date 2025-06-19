
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, Calendar, Settings, FileAudio } from 'lucide-react';
import MeetingRecorder from './MeetingRecorder';
import RecordingScheduler from './RecordingScheduler';
import RecordingPlayer from './RecordingPlayer';
import { RecordingStorageService } from '@/services/recordingStorageService';
import { useToast } from '@/hooks/use-toast';

interface EnhancedMeetingRecorderProps {
  onRecordingComplete?: () => void;
}

const EnhancedMeetingRecorder = ({ onRecordingComplete }: EnhancedMeetingRecorderProps) => {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadRecordings = async () => {
    setLoading(true);
    const recordingsList = await RecordingStorageService.getRecordings();
    setRecordings(recordingsList);
    setLoading(false);
  };

  const handleRecordingComplete = async () => {
    await loadRecordings();
    if (onRecordingComplete) {
      onRecordingComplete();
    }
  };

  const handleDownload = (recording: any) => {
    if (recording.audio_file_url) {
      const link = document.createElement('a');
      link.href = recording.audio_file_url;
      link.download = recording.file_name || `${recording.title}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = (recording: any) => {
    if (navigator.share) {
      navigator.share({
        title: recording.title,
        text: `Listen to this recording: ${recording.title}`,
        url: recording.audio_file_url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(recording.audio_file_url);
      toast({
        title: "Link Copied",
        description: "Recording link copied to clipboard.",
      });
    }
  };

  const handleDelete = async (recordingId: string) => {
    const success = await RecordingStorageService.deleteRecording(recordingId);
    if (success) {
      toast({
        title: "Recording Deleted",
        description: "Recording has been permanently deleted.",
      });
      await loadRecordings();
    } else {
      toast({
        title: "Delete Failed",
        description: "Failed to delete recording.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Phone className="h-5 w-5 mr-2 text-primary" />
          Advanced Meeting & Call Recorder
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="record" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="record" className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Record</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="recordings" className="flex items-center space-x-2">
              <FileAudio className="h-4 w-4" />
              <span>Recordings</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="record" className="mt-6">
            <MeetingRecorder onRecordingComplete={handleRecordingComplete} />
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <RecordingScheduler />
          </TabsContent>

          <TabsContent value="recordings" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Your Recordings</h3>
                <button
                  onClick={loadRecordings}
                  className="text-sm text-primary hover:underline"
                >
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading recordings...</p>
                </div>
              ) : recordings.length === 0 ? (
                <div className="text-center py-8">
                  <FileAudio className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No recordings found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recordings.map((recording) => (
                    <RecordingPlayer
                      key={recording.id}
                      audioUrl={recording.audio_file_url}
                      title={recording.title}
                      duration={recording.duration}
                      recordingType={recording.recording_type}
                      onShare={() => handleShare(recording)}
                      onDownload={() => handleDownload(recording)}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="space-y-6">
              <div className="p-4 bg-accent/20 rounded-lg">
                <h3 className="font-medium mb-2">Recording Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Configure default settings for meeting recordings, including quality presets,
                  auto-deletion policies, and notification preferences.
                </p>
              </div>
              
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="font-medium mb-2 text-amber-800">Compliance & Privacy</h3>
                <p className="text-sm text-amber-700">
                  Always ensure you have proper consent before recording meetings or calls.
                  Recordings are stored securely and can be automatically deleted based on your
                  compliance requirements.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedMeetingRecorder;
