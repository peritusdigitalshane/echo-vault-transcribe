
import { supabase } from "@/integrations/supabase/client";

export interface MeetingTranscriptionResult {
  success: boolean;
  meeting_id?: string;
  text?: string;
  error?: string;
}

export const transcribeMeeting = async (
  audioBlob: Blob, 
  title: string = 'Meeting Recording',
  participants: string[] = []
): Promise<MeetingTranscriptionResult> => {
  try {
    // Get the current session and token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    console.log('Session found, preparing meeting transcription request');

    // Create form data
    const formData = new FormData();
    formData.append('audio', audioBlob, 'meeting-recording.webm');
    formData.append('title', title);
    formData.append('participants', JSON.stringify(participants));
    formData.append('meeting_type', 'video_conference');

    // Call the edge function with proper headers
    const { data, error } = await supabase.functions.invoke('transcribe-meeting', {
      body: formData,
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Meeting transcription failed');
    }

    if (!data) {
      throw new Error('No data received from meeting transcription service');
    }

    return data;

  } catch (error: any) {
    console.error('Meeting transcription service error:', error);
    return {
      success: false,
      error: error.message || 'Failed to transcribe meeting'
    };
  }
};
