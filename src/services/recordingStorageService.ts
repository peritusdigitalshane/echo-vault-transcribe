
import { supabase } from "@/integrations/supabase/client";

export interface RecordingMetadata {
  id?: string;
  title: string;
  recording_type: 'meeting' | 'phone_call' | 'interview' | 'voice_note';
  duration?: string;
  file_size?: number;
  file_name?: string;
  audio_quality: 'low' | 'medium' | 'high';
  participants?: string[];
  consent_given?: boolean;
  scheduled_deletion?: string;
  created_at?: string;
  user_id?: string;
}

export class RecordingStorageService {
  static async saveRecording(
    audioBlob: Blob, 
    metadata: RecordingMetadata
  ): Promise<{ success: boolean; recordingId?: string; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${metadata.recording_type}_${timestamp}.webm`;
      const filePath = `recordings/${session.user.id}/${fileName}`;

      // Upload audio file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-recordings')
        .upload(filePath, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('audio-recordings')
        .getPublicUrl(filePath);

      // Save recording metadata to database
      const recordingData = {
        user_id: session.user.id,
        title: metadata.title,
        recording_type: metadata.recording_type,
        audio_file_url: publicUrl,
        file_name: fileName,
        file_size: audioBlob.size,
        audio_quality: metadata.audio_quality,
        participants: metadata.participants || [],
        consent_given: metadata.consent_given || false,
        scheduled_deletion: metadata.scheduled_deletion,
        status: 'completed'
      };

      const { data: dbData, error: dbError } = await supabase
        .from('recordings')
        .insert(recordingData)
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      return {
        success: true,
        recordingId: dbData.id
      };

    } catch (error: any) {
      console.error('Recording storage error:', error);
      return {
        success: false,
        error: error.message || 'Failed to save recording'
      };
    }
  }

  static async getRecordings(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('recordings')
        .select(`
          *,
          recording_tags (
            tags (
              id,
              name,
              color
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(recording => ({
        ...recording,
        tags: recording.recording_tags?.map(rt => rt.tags).filter(Boolean) || []
      })) || [];

    } catch (error: any) {
      console.error('Error fetching recordings:', error);
      return [];
    }
  }

  static async deleteRecording(recordingId: string): Promise<boolean> {
    try {
      const { data: recording, error: fetchError } = await supabase
        .from('recordings')
        .select('audio_file_url, file_name')
        .eq('id', recordingId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      if (recording.file_name) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const filePath = `recordings/${session.user.id}/${recording.file_name}`;
          await supabase.storage
            .from('audio-recordings')
            .remove([filePath]);
        }
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('recordings')
        .delete()
        .eq('id', recordingId);

      if (deleteError) throw deleteError;

      return true;
    } catch (error: any) {
      console.error('Error deleting recording:', error);
      return false;
    }
  }

  static async scheduleRecordingDeletion(recordingId: string, deletionDate: Date): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('recordings')
        .update({ scheduled_deletion: deletionDate.toISOString() })
        .eq('id', recordingId);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error scheduling recording deletion:', error);
      return false;
    }
  }
}
