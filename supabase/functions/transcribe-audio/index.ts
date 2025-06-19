
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Transcribe audio function called');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the JWT token from the request headers
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No authorization header found');
      throw new Error('No authorization header');
    }

    // Extract the token (remove 'Bearer ' prefix)
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);

    // Create a client with the user's token to verify authentication
    const userSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // Try to get the user using the token
    const { data: { user }, error: authError } = await userSupabase.auth.getUser(token);
    console.log('User verification result:', { user: !!user, error: !!authError });

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Invalid authorization');
    }

    console.log('User authenticated:', user.id);

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const title = formData.get('title') as string || 'Untitled Recording';

    console.log('Form data received:', { 
      hasAudio: !!audioFile, 
      title, 
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
