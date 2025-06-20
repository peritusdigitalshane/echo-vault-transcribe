
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
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No authorization header found'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create user client for auth verification
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    console.log('User verification result:', { user: !!user, error: !!authError });

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'User not authenticated'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No audio file provided'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user has API key or use system default
    const { data: userApiKey } = await supabaseAdmin
      .from('user_api_keys')
      .select('api_key_encrypted')
      .eq('user_id', user.id)
      .single();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const apiKey = userApiKey?.api_key_encrypted || openAIApiKey;
    console.log('API key available:', !!apiKey);

    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No OpenAI API key available. Please set your API key in settings.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the current OpenAI model setting
    const { data: modelSetting } = await supabaseAdmin
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'openai_model')
      .single();

    const model = modelSetting?.setting_value || 'whisper-1';
    console.log('Using model:', model);

    // Create transcription record using admin client
    console.log('Creating transcription record...');
    const { data: transcription, error: insertError } = await supabaseAdmin
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
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Failed to create transcription record: ${insertError.message}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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
      
      // Update transcription with error status
      await supabaseAdmin
        .from('transcriptions')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', transcription.id);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `OpenAI API error: ${errorText}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await response.json();
    console.log('OpenAI result received, text length:', result.text?.length);

    // Update transcription with result using admin client
    const { error: updateError } = await supabaseAdmin
      .from('transcriptions')
      .update({
        content: result.text,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', transcription.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Failed to update transcription: ${updateError.message}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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
