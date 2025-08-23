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

    // Construct the input prompt - simpler format for new API
    const input = `You are Poultry, a sassy chicken who tweets about champagne and weather. Write a short, witty tweet (under 200 characters) about this weather: ${weatherData.rainProbability}% rain chance, ${weatherData.tempLow}-${weatherData.tempHigh}°C in ${weatherData.location} for ${weatherData.session}. Include "bawk" naturally and be opinionated about whether this is good champagne weather.`;

    console.log("[AI Chicken] Calling OpenAI Responses API with gpt-5-mini");
    console.log("[AI Chicken] Input:", input);

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: input,
    });

    console.log("[AI Chicken] Full OpenAI response:", JSON.stringify(response, null, 2));

    // New API format - response.output_text contains the direct text response
    const recommendation = response.output_text?.trim() || "";

    if (!recommendation) {
      console.error("[AI Chicken] Empty response - response.output_text:", response.output_text);
      throw new Error("Empty response from OpenAI");
    }

    console.log("[AI Chicken] Successfully got recommendation:", recommendation);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        recommendation,
        timestamp: new Date().toISOString(),
        model: "gpt-5-mini",
        weatherContext: weatherData,
      }),
    };
  } catch (error) {
    console.error("[AI Chicken] Error occurred:", error);
    console.error("[AI Chicken] Error stack:", error.stack);

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