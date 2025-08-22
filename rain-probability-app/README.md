# Rain on Our Champagne

> A Netlify-hosted SPA that uses Open-Meteo's Historical API to compute rain probabilities for any city and calendar day since 1940. We fetch one daily range (1940→present) and many tiny hourly day-slices (one per year), aggregate client-side, and cache results in the browser. No keys, no backend.

## 🌧️ What it does

Enter any city and calendar date, and instantly see:

1. **Daily probability**: % of years it rained on that day (since data start)
2. **Hourly breakdown**: 24-hour chart showing rain probability by hour
3. **Time windows**: Rain probability for Morning, Noon, Afternoon, and Evening periods

## 🚀 Features

- **Zero backend required** - runs entirely in the browser
- **Smart caching** - results cached locally for 30 days
- **Fast performance** - concurrent API requests with ~1-2s response times
- **Mobile responsive** - works great on all devices
- **Historical accuracy** - uses ERA5 reanalysis data since 1940

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Data**: Open-Meteo Historical API
- **Deployment**: Netlify
- **Caching**: Browser sessionStorage

## 📊 Data Sources

- **Geocoding**: [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
- **Weather Data**: [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api)
- **Dataset**: ERA5 reanalysis (1940-present)

## 🏗️ Architecture

```
User Input → Geocoding → Daily Data → Hourly Data → Statistics → Display
    ↓           ↓           ↓           ↓           ↓
   Cache    Cache       Cache      Cache      Results
```

1. **Geocode** city to lat/lon coordinates
2. **Fetch daily** precipitation data (1940-present) 
3. **Calculate** which years had rain on target date
4. **Fetch hourly** data for that specific date across all years
5. **Aggregate** into hourly probabilities and time windows
6. **Cache** all responses to avoid repeat requests

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm

### Development

```bash
# Clone the repository
git clone <your-repo-url>
cd rain-probability-app

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment to Netlify

1. Push your code to GitHub
2. Connect your repo to Netlify
3. Build settings are configured in `netlify.toml`
4. Deploy automatically on push to main branch

## 📝 Configuration

Key constants in `src/lib/config.ts`:

```typescript
export const WINDOWS = [
  { key: 'morning', start: 9, end: 12 },   // 09:00-12:00
  { key: 'noon', start: 12, end: 15 },     // 12:00-15:00  
  { key: 'afternoon', start: 15, end: 18 }, // 15:00-18:00
  { key: 'evening', start: 18, end: 21 },  // 18:00-21:00
];

export const RAIN_THRESHOLD_MM = 0.0;  // Minimum rain to count
export const DEFAULT_START_YEAR = 1940; // Historical data start
export const CACHE_TTL_DAYS = 30;       // Browser cache duration
```

## 🎯 Performance

- **Geocoding**: ~50-150ms
- **Daily data**: ~300-700ms (typically <1MB)
- **Hourly data**: ~600-1200ms (70-80 concurrent requests)
- **Total first load**: ~1-2s
- **Cached revisits**: ~100-300ms

## 🔧 API Limits

Open-Meteo free tier has daily request limits. For production use:
- Consider adding rate limiting
- Implement server-side caching
- Contact Open-Meteo for commercial usage

## 🎨 Customization

### Time Windows
Edit `WINDOWS` array in `config.ts` to change time periods.

### Rain Threshold  
Modify `RAIN_THRESHOLD_MM` to change what counts as "rain".

### Styling
Update Tailwind classes or extend the theme in `tailwind.config.js`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🌟 Acknowledgments

- [Open-Meteo](https://open-meteo.com/) for excellent free weather APIs
- [ERA5](https://www.ecmwf.int/en/forecasts/datasets/reanalysis-datasets/era5) for historical reanalysis data
- [Recharts](https://recharts.org/) for beautiful React charts
- [Tailwind CSS](https://tailwindcss.com/) for rapid UI development

---

Built with ❤️ for weather nerds and event planners everywhere!
