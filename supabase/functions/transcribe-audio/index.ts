
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Transcribe audio function called');
    
    // Get the Authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No authorization header found');
      throw new Error('No authorization header');
    }

    // Extract the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    console.log('JWT token extracted:', !!token);

    // Create Supabase client with service role for backend operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT token manually using the auth.getUser method with the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log('User verification result:', { user: !!user, error: !!authError });

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('User not authenticated');
    }

    console.log('User authenticated:', user.id);

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const title = formData.get('title') as string || 'Untitled Recording';
    const recordingType = formData.get('recording_type') as string || 'voice_note';

    console.log('Form data received:', { 
      hasAudio: !!audioFile, 
      title, 
      recordingType,
      audioSize: audioFile?.size 
    });

    if (!audioFile) {
      throw new Error('No audio file provided');
    }

    // Check if user has API key or use system default
    const { data: userApiKey } = await supabase
      .from('user_api_keys')
      .select('api_key_encrypted')
      .eq('user_id', user.id)
      .single();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const apiKey = userApiKey?.api_key_encrypted || openAIApiKey;
    console.log('API key available:', !!apiKey);

    if (!apiKey) {
      throw new Error('No OpenAI API key available. Please set your API key in settings.');
    }

    // Get the current OpenAI model setting
    const { data: modelSetting } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'openai_model')
      .single();

    const model = modelSetting?.setting_value || 'whisper-1';
    console.log('Using model:', model);

    // Create transcription record
    console.log('Creating transcription record...');
    const { data: transcription, error: insertError } = await supabase
      .from('transcriptions')
      .insert({
        user_id: user.id,
        title: title,
        status: 'processing',
        file_name: audioFile.name,
        file_size: audioFile.size,
        model_used: model
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`Failed to create transcription record: ${insertError.message}`);
    }

    console.log('Transcription record created:', transcription.id);

    // Also save to recordings table if it's a meeting
    if (recordingType !== 'voice_note') {
      console.log('Saving to recordings table...');
      
      // First upload the audio file to storage
      const timestamp = Date.now();
      const fileName = `${recordingType}_${timestamp}.webm`;
      const filePath = `recordings/${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-recordings')
        .upload(filePath, audioFile, {
          contentType: audioFile.type || 'audio/webm',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        // Continue with transcription even if storage fails
      } else {
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('audio-recordings')
          .getPublicUrl(filePath);

        // Save recording metadata
        const { error: recordingError } = await supabase
          .from('recordings')
          .insert({
            user_id: user.id,
            title: title,
            recording_type: recordingType,
            audio_file_url: publicUrl,
            file_name: fileName,
            file_size: audioFile.size,
            audio_quality: 'medium',
            status: 'completed'
          });

        if (recordingError) {
          console.error('Recording save error:', recordingError);
          // Continue with transcription even if recording save fails
        }
      }
    }

    // Prepare form data for OpenAI
    const openAIFormData = new FormData();
    openAIFormData.append('file', audioFile);
    openAIFormData.append('model', model);

    console.log('Sending to OpenAI...');
    // Send to OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: openAIFormData,
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    console.log('OpenAI result received, text length:', result.text?.length);

    // Update transcription with result
    const { error: updateError } = await supabase
      .from('transcriptions')
      .update({
        content: result.text,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', transcription.id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error(`Failed to update transcription: ${updateError.message}`);
    }

    console.log('Transcription completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        transcription_id: transcription.id,
        text: result.text 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
