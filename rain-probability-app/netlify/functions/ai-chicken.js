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

    // Construct the prompt for the AI chicken
    const prompt = `Weather Update for ${weatherData.location} on ${weatherData.date}:
- Session: ${weatherData.session} (${weatherData.sessionTime})
- Rain chance: ${weatherData.rainProbability}% 
- Temperature: ${weatherData.tempLow}°C - ${weatherData.tempHigh}°C
- Based on ${weatherData.totalYears} years of data

As Poultry the wise chicken, give your witty champagne advice! Include "bawk" or chicken sounds naturally. Keep it under 250 characters and be opinionated about whether this weather is good for champagne sessions.`;

    console.log('[AI Chicken] Calling OpenAI API with GPT-5-mini');
    console.log('[AI Chicken] Prompt being sent:', prompt);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini-2025-08-07",
      messages: [
        {
          role: "system",
          content: "You are Poultry, a witty and opinionated chicken who gives champagne advice. Your responses should be under 250 characters, whimsical, and include natural chicken sounds. Always provide a response - never return empty content."
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
      console.warn('[AI Chicken] Empty recommendation received from OpenAI');
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