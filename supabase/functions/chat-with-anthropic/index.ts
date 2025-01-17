import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Anthropic } from "https://esm.sh/@anthropic-ai/sdk@0.14.1";
import { corsHeaders, fetchRaceData, fetchSettings, processRaceDocuments, formatRaceContext } from "./utils.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, raceId, conversationHistory, images } = await req.json();
    console.log('Making request to Anthropic API with:', { 
      messageCount: conversationHistory?.length,
      systemPromptLength: raceId.length,
      historyLength: conversationHistory?.length || 0,
      totalImagesProcessed: images?.length || 0
    });

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    });

    const race = await fetchRaceData(raceId);
    const settings = await fetchSettings();
    console.log('Fetched race data with runners:', race.runners?.length);

    const raceContext = formatRaceContext(race);
    console.log('Generated race context length:', raceContext.length);

    const messages = [];

    // Add race documents as images if they exist
    if (race.race_documents?.length) {
      console.log('Processing race documents:', race.race_documents.length);
      const processedImages = await processRaceDocuments(race, Deno.env.get('SUPABASE_URL') || '');
      messages.push(...processedImages.map(img => ({
        role: "user",
        content: [img, { type: "text", text: "Please analyze this race document." }]
      })));
    }

    // Add conversation history
    if (conversationHistory?.length > 0) {
      messages.push(...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.message
      })));
    }

    // Add current message with any uploaded image
    const currentContent = [];
    
    // Add any newly uploaded image from the chat
    if (images?.length > 0) {
      console.log('Processing newly uploaded chat images:', images.length);
      images.forEach(img => {
        currentContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: img.source.media_type,
            data: img.source.data
          }
        });
      });
    }

    // Add the text message if it exists
    if (message) {
      currentContent.push({ type: "text", text: message });
    }
    
    if (currentContent.length > 0) {
      messages.push({
        role: "user",
        content: currentContent
      });
    }

    console.log('Making request to Anthropic API with:', {
      messageCount: messages.length,
      hasImages: images?.length > 0,
      modelUsed: settings?.anthropic_model
    });

    const response = await anthropic.messages.create({
      model: settings?.anthropic_model || 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      system: `${settings?.system_prompt || "You are a horse racing expert analyst who maintains a great knowledge of horse racing."}\n\nRace Context:\n${raceContext}`,
      messages
    });

    console.log('Received response from Claude:', {
      responseLength: response.content[0].text.length,
      estimatedTokens: Math.ceil(response.content[0].text.length / 4),
      imagesIncluded: images?.length || 0
    });

    return new Response(
      JSON.stringify({ message: response.content[0].text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-with-anthropic function:', error);
    return new Response(
      JSON.stringify({ error: true, message: error.message || 'An unexpected error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});