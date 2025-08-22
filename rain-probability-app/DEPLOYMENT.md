# 🚀 Deployment Instructions

## Netlify Configuration

The app is configured for Netlify deployment with the following structure:

```
netlify.toml:
- base: rain-probability-app
- publish: dist (built by Vite)
- functions: netlify/functions
```

## Environment Variables

**CRITICAL:** You must set the OpenAI API key as an environment variable in Netlify:

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the following variable:
   - **Key:** `OPENAI_API_KEY`
   - **Value:** 
## Build Process

The build process:
1. Runs `npm run build` in the `rain-probability-app` directory
2. Creates a `dist` folder with the built static files
3. The `netlify/functions/ai-chicken.js` function is deployed for AI features

## AI Chicken Feature

Once deployed with the environment variable:
- Users can click "🐔 Ask Poultry" to get AI-powered champagne recommendations
- The function uses OpenAI's GPT-4o-mini for cost-effective responses
- Fallback responses ensure the feature works even if OpenAI is unavailable

## Troubleshooting

- **Build fails with missing dist:** Ensure paths in netlify.toml are correct (fixed)
- **AI chicken doesn't work:** Check that OPENAI_API_KEY is set in environment variables
- **Functions not deploying:** Verify functions path is `netlify/functions` relative to base 