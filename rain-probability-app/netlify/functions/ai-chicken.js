const { OpenAI } = require("openai");

exports.handler = async (event, context) => {
  console.log("[AI Chicken] Function invoked");

  // Handle CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { weatherData } = JSON.parse(event.body);

    if (!weatherData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Weather data is required" }),
      };
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Construct the prompt
    const prompt = `Weather: ${weatherData.rainProbability}% rain chance, ${weatherData.tempLow}-${weatherData.tempHigh}°C in ${weatherData.location} for ${weatherData.session}.

Write a short, witty tweet from Poultry the chicken about whether this is good champagne weather. Include "bawk" and be opinionated. Under 200 characters.`;

    console.log("[AI Chicken] Calling OpenAI Responses API with GPT-5 mini");

    const response = await openai.responses.create({
      model: "gpt-5-mini-2025-08-07",
      input: [
        {
          role: "system",
          content:
            "You are Poultry, a sassy chicken who tweets about champagne and weather. Always respond with a short, witty tweet under 200 characters. Include 'bawk' naturally. Never return empty responses.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_output_tokens: 150,
    });

    console.log("[AI Chicken] Full OpenAI response:", JSON.stringify(response, null, 2));

    // Responses API puts text in response.output[0].content
    const recommendation =
      response.output?.[0]?.content?.[0]?.text?.trim() || "";

    if (!recommendation) {
      throw new Error("Empty response from OpenAI");
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        recommendation,
        timestamp: new Date().toISOString(),
        model: "gpt-5-mini-2025-08-07",
        weatherContext: weatherData,
      }),
    };
  } catch (error) {
    console.error("[AI Chicken] Error occurred:", error);

    const fallbackResponses = [
      "Bawk bawk! Something went wrong in my coop 🐔 Try again later for proper champagne wisdom!",
      "Cluck! My feathers are ruffled by technical difficulties. Give me a moment to preen and try again! 🪶",
      "Bawk! Even chickens need debugging sometimes. Please try again - I promise better champagne advice! 🍾",
    ];

    const fallback =
      fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        recommendation: fallback,
        timestamp: new Date().toISOString(),
        fallback: true,
        error: error.message,
      }),
    };
  }
}; 