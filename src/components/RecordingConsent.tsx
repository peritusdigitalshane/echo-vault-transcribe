
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Users } from 'lucide-react';

interface RecordingConsentProps {
  isOpen: boolean;
  onClose: () => void;
  onConsent: (consentData: ConsentData) => void;
  recordingType: 'meeting' | 'phone_call' | 'interview';
}

interface ConsentData {
  consentGiven: boolean;
  participants: string[];
  notificationSent: boolean;
}

const RecordingConsent = ({ isOpen, onClose, onConsent, recordingType }: RecordingConsentProps) => {
  const [consentGiven, setConsentGiven] = useState(false);
  const [participants, setParticipants] = useState<string[]>(['']);
  const [notificationSent, setNotificationSent] = useState(false);

  const addParticipant = () => {
    setParticipants([...participants, '']);
  };

  const updateParticipant = (index: number, value: string) => {
    const updated = [...participants];
    updated[index] = value;
    setParticipants(updated);
  };

  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    if (!consentGiven) return;

    onConsent({
      consentGiven,
      participants: participants.filter(p => p.trim() !== ''),
      notificationSent
    });

    onClose();
  };

  const getRecordingTypeText = () => {
    switch (recordingType) {
      case 'meeting':
        return 'meeting';
      case 'phone_call':
        return 'phone call';
      case 'interview':
        return 'interview';
      default:
        return 'conversation';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <span>Recording Consent Required</span>
          </DialogTitle>
          <DialogDescription>
            Before starting the {getRecordingTypeText()} recording, please confirm consent and participant details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Consent Checkbox */}
          <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <Checkbox
              id="consent"
              checked={consentGiven}
              onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
            />
            <div className="space-y-1">
              <Label htmlFor="consent" className="text-sm font-medium cursor-pointer">
                I have permission to record this {getRecordingTypeText()}
              </Label>
              <p className="text-xs text-muted-foreground">
                All participants have been informed and consented to being recorded.
              </p>
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Participants (Optional)
            </Label>
            
            {participants.map((participant, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder={`Participant ${index + 1} name or email`}
                  value={participant}
                  onChange={(e) => updateParticipant(index, e.target.value)}
                  className="flex-1"
                />
                {participants.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeParticipant(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={addParticipant}
              className="w-full"
            >
              Add Participant
            </Button>
          </div>

          {/* Notification Option */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="notification"
              checked={notificationSent}
              onCheckedChange={(checked) => setNotificationSent(checked as boolean)}
            />
            <Label htmlFor="notification" className="text-sm cursor-pointer">
              Send recording notification to participants
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!consentGiven}
              className="flex-1"
            >
              Start Recording
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordingConsent;
