
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Tag {
  id: string;
  name: string;
  color: string;
}

export const useNoteTags = (noteId: string | null) => {
  const [noteTags, setNoteTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (noteId) {
      fetchNoteTags();
    }
  }, [noteId]);

  const fetchNoteTags = async () => {
    if (!noteId) return;

    try {
      const { data, error } = await supabase
        .from('note_tags')
        .select(`
          tag_id,
          tags:tag_id (
            id,
            name,
            color
          )
        `)
        .eq('note_id', noteId);

      if (error) throw error;
      
      const tags = data?.map(item => item.tags).filter(Boolean) || [];
      setNoteTags(tags);
    } catch (error: any) {
      console.error('Error fetching note tags:', error);
    }
  };

  const updateNoteTags = async (tagIds: string[]) => {
    if (!noteId) return;

    setLoading(true);
    try {
      // First, remove existing tags
      await supabase
        .from('note_tags')
        .delete()
        .eq('note_id', noteId);

      // Then add new tags
      if (tagIds.length > 0) {
        const noteTagsToInsert = tagIds.map(tagId => ({
          note_id: noteId,
          tag_id: tagId
        }));

        const { error } = await supabase
          .from('note_tags')
          .insert(noteTagsToInsert);

        if (error) throw error;
      }

      await fetchNoteTags();
      
      toast({
        title: "Tags Updated",
        description: "Note tags have been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating note tags:', error);
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
    noteTags,
    updateNoteTags,
    loading,
    refetch: fetchNoteTags
  };
};
