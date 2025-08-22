const { OpenAI } = require('openai');

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { weatherData } = JSON.parse(event.body);
    
    if (!weatherData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Weather data is required' }),
      };
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Construct the prompt for the AI chicken
    const prompt = `You are Poultry, an intelligent chicken who has strong opinions about champagne, running, and weather. You give whimsical, tweet-like recommendations (max 280 characters) about champagne sessions based on weather data.

Weather Data:
- Location: ${weatherData.location}
- Date: ${weatherData.date}
- Session: ${weatherData.session} (${weatherData.sessionTime})
- Rain Probability: ${weatherData.rainProbability}%
- Temperature Range: ${weatherData.tempLow}°C - ${weatherData.tempHigh}°C
- Historical Context: ${weatherData.totalYears} years of data, ${weatherData.rainyYears} were rainy

Give a witty, chicken-themed recommendation about whether this is good champagne weather. Be whimsical but informative. Include chicken sounds like "bawk" naturally. Keep it under 280 characters and make it feel like a tweet from an opinionated chicken.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Poultry, a witty and opinionated chicken who gives champagne advice. Your responses should be under 280 characters, whimsical, and include natural chicken sounds."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.9, // Higher temperature for more creative/whimsical responses
    });

    const recommendation = completion.choices[0].message.content.trim();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        recommendation,
        timestamp: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error('AI Chicken Error:', error);
    
    // Fallback chicken responses if API fails
    const fallbackResponses = [
      "Bawk bawk! Something went wrong in my coop 🐔 Try again later for proper champagne wisdom!",
      "Cluck! My feathers are ruffled by technical difficulties. Give me a moment to preen and try again! 🪶",
      "Bawk! Even chickens need debugging sometimes. Please try again - I promise better champagne advice! 🍾"
    ];
    
    const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        recommendation: fallback,
        timestamp: new Date().toISOString(),
        fallback: true
      }),
    };
  }
}; 