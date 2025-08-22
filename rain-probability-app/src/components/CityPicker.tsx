

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
        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
          City
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
        <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
          Country Code (optional)
        </label>
        <input
          type="text"
          id="country"
          value={country}
          onChange={(e) => onCountryChange(e.target.value.toUpperCase())}
          placeholder="US, GB, DE..."
          maxLength={2}
          className="input-field"
          disabled={disabled}
        />
        <p className="text-xs text-gray-500 mt-1">
          2-letter country code to disambiguate cities
        </p>
      </div>
    </div>
  );
} 