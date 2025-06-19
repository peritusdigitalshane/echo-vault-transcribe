
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Transcription {
  id: string;
  title: string;
  content: string | null;
  audio_file_url: string | null;
  duration: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface EditTranscriptionDialogProps {
  transcription: Transcription;
  onUpdate: () => void;
}

const EditTranscriptionDialog = ({ transcription, onUpdate }: EditTranscriptionDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(transcription.title);
  const [content, setContent] = useState(transcription.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('transcriptions')
        .update({
          title: title.trim(),
          content: content.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', transcription.id);

      if (error) throw error;

      toast({
        title: "Transcription Updated",
        description: "Your changes have been saved successfully.",
      });

      setIsOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error('Error updating transcription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update transcription.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTitle(transcription.title);
    setContent(transcription.content || "");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit3 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transcription</DialogTitle>
          <DialogDescription>
            Update the title and content of your transcription.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter transcription title..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter transcription content..."
              className="min-h-[300px]"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTranscriptionDialog;
