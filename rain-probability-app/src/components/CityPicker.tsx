

interface CityPickerProps {
  city: string;
  country: string;
  onCityChange: (city: string) => void;
  onCountryChange: (country: string) => void;
  disabled?: boolean;
}

export function CityPicker({
  city,
  country,
  onCityChange,
  onCountryChange,
  disabled = false,
}: CityPickerProps) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="city" className="block text-sm font-semibold text-amber-900 mb-2">
          🏙️ City
        </label>
        <input
          type="text"
          id="city"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder="Enter city name..."
          className="input-field"
          disabled={disabled}
        />
      </div>
      
      <div>
        <label htmlFor="country" className="block text-sm font-semibold text-amber-900 mb-2">
          🌍 Country Code (optional)
        </label>
        <input
          type="text"
          id="country"
          value={country}
          onChange={(e) => onCountryChange(e.target.value.toUpperCase())}
          placeholder="US, GB, DE..."
          maxLength={2}
          className="input-field text-center font-mono"
          disabled={disabled}
        />
        <p className="text-xs text-amber-700 mt-2">
          ✨ 2-letter code to find the perfect location
        </p>
      </div>
    </div>
  );
} 