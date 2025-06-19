
import { supabase } from "@/integrations/supabase/client";

export interface TranscriptionResult {
  success: boolean;
  transcription_id?: string;
  text?: string;
  error?: string;
}

export const transcribeAudio = async (
  audioBlob: Blob, 
  title: string = 'Untitled Recording',
  recordingType: 'voice_note' | 'meeting' | 'phone_call' = 'voice_note'
): Promise<TranscriptionResult> => {
  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    console.log('Starting transcription for:', title);
    console.log('Audio blob size:', audioBlob.size);
    console.log('Recording type:', recordingType);

    // Create form data
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('title', title);
    formData.append('recording_type', recordingType);

    console.log('Calling edge function...');

    // Call the edge function
    const { data, error } = await supabase.functions.invoke('transcribe-audio', {
      body: formData,
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    console.log('Edge function response:', { data, error });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Transcription failed');
    }

    if (!data) {
      throw new Error('No data received from transcription service');
    }

    if (!data.success) {
      throw new Error(data.error || 'Transcription failed');
    }

    console.log('Transcription successful:', data.transcription_id);
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
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    console.log('Starting file transcription for:', file.name);
    console.log('File size:', file.size);
    console.log('File type:', file.type);

    // Create form data
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
    formData.append('recording_type', 'voice_note');

    console.log('Calling edge function...');

    // Call the edge function
    const { data, error } = await supabase.functions.invoke('transcribe-audio', {
      body: formData,
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    console.log('Edge function response:', { data, error });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Transcription failed');
    }

    if (!data) {
      throw new Error('No data received from transcription service');
    }

    if (!data.success) {
      throw new Error(data.error || 'Transcription failed');
    }

    console.log('File transcription successful:', data.transcription_id);
    return data;

  } catch (error: any) {
    console.error('File transcription service error:', error);
    return {
      success: false,
      error: error.message || 'Failed to transcribe file'
    };
  }
};
