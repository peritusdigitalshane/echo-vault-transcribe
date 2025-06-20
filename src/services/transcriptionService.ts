
import { supabase } from "@/integrations/supabase/client";

export interface TranscriptionResult {
  success: boolean;
  transcription_id?: string;
  text?: string;
  error?: string;
}

export const transcribeAudio = async (
  audioBlob: Blob, 
  title: string = 'Untitled Recording'
): Promise<TranscriptionResult> => {
  try {
    // Get the current session and token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Create form data
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('title', title);

    // Call the edge function with proper headers
    const { data, error } = await supabase.functions.invoke('transcribe-audio', {
      body: formData,
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Transcription failed');
    }

    if (!data) {
      throw new Error('No data received from transcription service');
    }

    return data;

  } catch (error: any) {
    console.error('Transcription service error:', error);
    return {
      success: false,
      error: error.message || 'Failed to transcribe audio'
    };
  }
};

export const uploadAndTranscribeFile = async (
  file: File
): Promise<TranscriptionResult> => {
  try {
    // Get the current session and token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Create form data
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

    // Call the edge function with proper headers
    const { data, error } = await supabase.functions.invoke('transcribe-audio', {
      body: formData,
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Transcription failed');
    }

    if (!data) {
      throw new Error('No data received from transcription service');
    }

    return data;

  } catch (error: any) {
    console.error('File transcription service error:', error);
    return {
      success: false,
      error: error.message || 'Failed to transcribe file'
    };
  }
};
