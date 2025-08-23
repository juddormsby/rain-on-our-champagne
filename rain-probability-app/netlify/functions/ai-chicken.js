const { OpenAI } = require('openai');

exports.handler = async (event, context) => {
  console.log('[AI Chicken] Function invoked');
  
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    console.log('[AI Chicken] CORS preflight request');
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    console.log('[AI Chicken] Invalid method:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('[AI Chicken] Parsing request body');
    const { weatherData } = JSON.parse(event.body);
    
    if (!weatherData) {
      console.log('[AI Chicken] No weather data provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Weather data is required' }),
      };
    }

    console.log('[AI Chicken] Weather data received:', JSON.stringify(weatherData, null, 2));

    if (!process.env.OPENAI_API_KEY) {
      console.error('[AI Chicken] OpenAI API key not found in environment variables');
      throw new Error('OpenAI API key not configured');
    }

    console.log('[AI Chicken] Initializing OpenAI client');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Construct the prompt for the AI chicken - simplified for GPT-5 mini
    const prompt = `Weather: ${weatherData.rainProbability}% rain chance, ${weatherData.tempLow}-${weatherData.tempHigh}°C in ${weatherData.location} for ${weatherData.session}.

Write a short, witty tweet from Poultry the chicken about whether this is good champagne weather. Include "bawk" and be opinionated. Under 200 characters.`;

    console.log('[AI Chicken] Calling OpenAI API with GPT-5-mini');
    console.log('[AI Chicken] Prompt being sent:', prompt);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini-2025-08-07",
      messages: [
        {
          role: "system",
          content: "You are Poultry, a sassy chicken who tweets about champagne and weather. Always respond with a short, witty tweet under 200 characters. Include 'bawk' naturally. Never return empty responses."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 150, // Increased to allow for longer responses
      // Note: GPT-5 mini only supports default temperature (1), so omitting temperature parameter
    });

    console.log('[AI Chicken] Full OpenAI response:', JSON.stringify(completion, null, 2));
    
    const recommendation = completion.choices[0]?.message?.content?.trim() || '';
    console.log('[AI Chicken] Extracted recommendation:', `"${recommendation}"`);
    console.log('[AI Chicken] Recommendation length:', recommendation.length);
    
    if (!recommendation) {
      console.warn('[AI Chicken] Empty recommendation received from OpenAI, trying fallback prompt');
      
      // Try a simpler fallback prompt
      const fallbackCompletion = await openai.chat.completions.create({
        model: "gpt-5-mini-2025-08-07",
        messages: [
          {
            role: "user",
            content: `Poultry the chicken says about ${weatherData.rainProbability}% rain chance: "Bawk!`
          }
        ],
        max_completion_tokens: 100,
      });
      
      const fallbackRec = fallbackCompletion.choices[0]?.message?.content?.trim();
      if (fallbackRec) {
        console.log('[AI Chicken] Fallback prompt worked:', fallbackRec);
        const finalRecommendation = `Bawk! ${fallbackRec}`;
        
        const response = {
          recommendation: finalRecommendation,
          timestamp: new Date().toISOString(),
          model: "gpt-5-mini-2025-08-07",
          weatherContext: weatherData,
          usedFallback: true
        };
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(response),
        };
      }
      
      console.error('[AI Chicken] Both primary and fallback prompts failed');
      throw new Error('Empty response from OpenAI');
    }

    const response = {
      recommendation,
      timestamp: new Date().toISOString(),
      model: "gpt-5-mini-2025-08-07",
      weatherContext: weatherData
    };

    console.log('[AI Chicken] Returning successful response');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('[AI Chicken] Error occurred:', error);
    console.error('[AI Chicken] Error stack:', error.stack);
    
    // Fallback chicken responses if API fails
    const fallbackResponses = [
      "Bawk bawk! Something went wrong in my coop 🐔 Try again later for proper champagne wisdom!",
      "Cluck! My feathers are ruffled by technical difficulties. Give me a moment to preen and try again! 🪶",
      "Bawk! Even chickens need debugging sometimes. Please try again - I promise better champagne advice! 🍾"
    ];
    
    const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

    console.log('[AI Chicken] Using fallback response:', fallback);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        recommendation: fallback,
        timestamp: new Date().toISOString(),
        fallback: true,
        error: error.message
      }),
    };
  }
}; 