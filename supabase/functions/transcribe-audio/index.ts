
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the JWT token from the request headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authorization');
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const title = formData.get('title') as string || 'Untitled Recording';

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

    // Create transcription record
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
      throw new Error(`Failed to create transcription record: ${insertError.message}`);
    }

    // Prepare form data for OpenAI
    const openAIFormData = new FormData();
    openAIFormData.append('file', audioFile);
    openAIFormData.append('model', model);

    // Send to OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: openAIFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();

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
      throw new Error(`Failed to update transcription: ${updateError.message}`);
    }

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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
