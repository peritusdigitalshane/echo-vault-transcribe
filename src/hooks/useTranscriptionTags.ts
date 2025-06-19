
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Tag {
  id: string;
  name: string;
  color: string;
}

export const useTranscriptionTags = (transcriptionId: string | null) => {
  const [transcriptionTags, setTranscriptionTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (transcriptionId) {
      fetchTranscriptionTags();
    }
  }, [transcriptionId]);

  const fetchTranscriptionTags = async () => {
    if (!transcriptionId) return;

    try {
      const { data, error } = await supabase
        .from('transcription_tags')
        .select(`
          tag_id,
          tags:tag_id (
            id,
            name,
            color
          )
        `)
        .eq('transcription_id', transcriptionId);

      if (error) throw error;
      
      const tags = data?.map(item => item.tags).filter(Boolean) || [];
      setTranscriptionTags(tags);
    } catch (error: any) {
      console.error('Error fetching transcription tags:', error);
    }
  };

  const updateTranscriptionTags = async (tagIds: string[]) => {
    if (!transcriptionId) return;

    setLoading(true);
    try {
      // First, remove existing tags
      await supabase
        .from('transcription_tags')
        .delete()
        .eq('transcription_id', transcriptionId);

      // Then add new tags
      if (tagIds.length > 0) {
        const transcriptionTagsToInsert = tagIds.map(tagId => ({
          transcription_id: transcriptionId,
          tag_id: tagId
        }));

        const { error } = await supabase
          .from('transcription_tags')
          .insert(transcriptionTagsToInsert);

        if (error) throw error;
      }

      await fetchTranscriptionTags();
      
      toast({
        title: "Tags Updated",
        description: "Transcription tags have been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating transcription tags:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update tags.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    transcriptionTags,
    updateTranscriptionTags,
    loading,
    refetch: fetchTranscriptionTags
  };
};
