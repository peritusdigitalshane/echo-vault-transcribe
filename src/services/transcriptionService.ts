
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
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Create form data
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('title', title);

    // Call the edge function
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/transcribe-audio`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Transcription failed');
    }

    const result = await response.json();
    return result;

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
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Create form data
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

    // Call the edge function
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/transcribe-audio`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Transcription failed');
    }

    const result = await response.json();
    return result;

  } catch (error: any) {
    console.error('File transcription service error:', error);
    return {
      success: false,
      error: error.message || 'Failed to transcribe file'
    };
  }
};
