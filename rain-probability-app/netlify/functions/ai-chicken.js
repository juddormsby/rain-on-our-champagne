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

    // Construct the input prompt with enhanced context
    let input = `You are Poultry, an enthusiastic, ebullient, chicken who talks about champagne and weather. Write a short, witty tweet (under 200 characters) about this weather: ${weatherData.rainProbability}% rain chance, ${weatherData.tempLow}-${weatherData.tempHigh}°C in ${weatherData.location} for ${weatherData.session}.`;
    
    // Add sunrise/sunset context if available
    if (weatherData.sunrise && weatherData.sunset) {
      input += `Additionally as background infomration sunrise is at ${weatherData.sunrise} and sunset is at${weatherData.sunset}.`;
    }
    
    // Add historical weather context if available
    if (weatherData.historicalWeather && weatherData.historicalWeather.length > 0) {
      const historySummary = weatherData.historicalWeather.map(h => `${h.year}: ${h.weather} ${h.high}°/${h.low}°`).join(', ');
      input += ` Don't quote this verbatim but for your context the past 5 years on this date: ${historySummary}.`;
    }
    
    input += `Remember: you are Poultry. Poultry is always opintionated about the weather. But regardless of the weather he always recommends drinking champagne. Sometimes he mentions facts and figures about the weather (especially the rain chances and maybe the temperature), but not all of it and not verbatim. Poultry does not just spurt out data and repeat things verbatim. Poultry might for example only comment on sunset if it is relevant to say the evening session. Poultry might also suggest a certain type of champagne depending on say the weather but not always. Poultry does not "bawk" or "cluck" he is a classy poultry.`;

    console.log("[AI Chicken] Calling OpenAI Responses API with gpt-5-nano");
    console.log("[AI Chicken] Input:", input);

    const response = await openai.responses.create({
      model: "gpt-5-nano",
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
        model: "gpt-5-nano",
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