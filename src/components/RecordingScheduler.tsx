
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScheduledRecording {
  id: string;
  title: string;
  startTime: Date;
  endTime?: Date;
  recordingType: 'meeting' | 'phone_call' | 'interview';
  autoStart: boolean;
  autoStop: boolean;
}

const RecordingScheduler = () => {
  const [schedules, setSchedules] = useState<ScheduledRecording[]>([]);
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    startTime: '',
    endTime: '',
    recordingType: 'meeting' as const,
    autoStart: true,
    autoStop: true
  });
  const { toast } = useToast();

  const createSchedule = () => {
    if (!newSchedule.title || !newSchedule.startTime) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and start time.",
        variant: "destructive",
      });
      return;
    }

    const schedule: ScheduledRecording = {
      id: `schedule_${Date.now()}`,
      title: newSchedule.title,
      startTime: new Date(newSchedule.startTime),
      endTime: newSchedule.endTime ? new Date(newSchedule.endTime) : undefined,
      recordingType: newSchedule.recordingType,
      autoStart: newSchedule.autoStart,
      autoStop: newSchedule.autoStop
    };

    setSchedules([...schedules, schedule]);
    setNewSchedule({
      title: '',
      startTime: '',
      endTime: '',
      recordingType: 'meeting',
      autoStart: true,
      autoStop: true
    });

    toast({
      title: "Recording Scheduled",
      description: `Recording "${schedule.title}" has been scheduled.`,
    });
  };

  const deleteSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id));
    toast({
      title: "Schedule Deleted",
      description: "Recording schedule has been removed.",
    });
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Timer className="h-5 w-5 mr-2 text-primary" />
          Recording Scheduler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create New Schedule */}
        <div className="space-y-4 p-4 bg-accent/20 rounded-lg">
          <h3 className="font-medium">Schedule New Recording</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduleTitle">Recording Title</Label>
              <Input
                id="scheduleTitle"
                placeholder="Weekly team meeting"
                value={newSchedule.title}
                onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recordingType">Recording Type</Label>
              <Select 
                value={newSchedule.recordingType} 
                onValueChange={(value: 'meeting' | 'phone_call' | 'interview') => 
                  setNewSchedule({ ...newSchedule, recordingType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="phone_call">Phone Call</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={newSchedule.startTime}
                onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time (Optional)</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={newSchedule.endTime}
                onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                checked={newSchedule.autoStart}
                onCheckedChange={(checked) => setNewSchedule({ ...newSchedule, autoStart: checked })}
              />
              <Label>Auto-start recording</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={newSchedule.autoStop}
                onCheckedChange={(checked) => setNewSchedule({ ...newSchedule, autoStop: checked })}
              />
              <Label>Auto-stop recording</Label>
            </div>
          </div>

          <Button onClick={createSchedule} className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Recording
          </Button>
        </div>

        {/* Scheduled Recordings */}
        {schedules.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Scheduled Recordings</h3>
            {schedules.map((schedule) => (
              <Card key={schedule.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{schedule.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {schedule.startTime.toLocaleString()}
                        </span>
                        {schedule.endTime && (
                          <span>→ {schedule.endTime.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSchedule(schedule.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecordingScheduler;
