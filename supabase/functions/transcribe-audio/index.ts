
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
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No authorization header' 
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Auth header present:', !!authHeader);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Server configuration error' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Create client with anon key and set auth header
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Verify the user with the session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Authentication failed: ${authError?.message || 'User not found'}` 
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
    const recordingType = formData.get('recording_type') as string || 'voice_note';

    if (!audioFile) {
      console.error('No audio file provided');
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

    // Check for OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('No OpenAI API key available');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No OpenAI API key configured. Please contact administrator.' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create transcription record
    const { data: transcription, error: insertError } = await supabase
      .from('transcriptions')
      .insert({
        user_id: user.id,
        title: title,
        status: 'processing',
        file_name: audioFile.name,
        file_size: audioFile.size,
        model_used: 'whisper-1'
      })
      .select()
      .single();

    if (insertError || !transcription) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Failed to create transcription record: ${insertError?.message || 'Unknown error'}` 
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
    openAIFormData.append('model', 'whisper-1');

    console.log('Sending to OpenAI...');
    // Send to OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: openAIFormData,
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error:', errorText);
      
      // Update transcription status to failed
      await supabase
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
        error: `Server error: ${error.message}` 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
