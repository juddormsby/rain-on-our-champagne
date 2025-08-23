 
import { format } from 'date-fns';

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  disabled?: boolean;
}

export function DatePicker({
  selectedDate,
  onDateChange,
  disabled = false,
}: DatePickerProps) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    if (dateStr) {
      // Parse MM-DD format and set to current year
      const [month, day] = dateStr.split('-').map(Number);
      const currentYear = new Date().getFullYear();
      onDateChange(new Date(currentYear, month - 1, day));
    }
  };

  // Format as MM-DD for the input
  const dateInputValue = format(selectedDate, 'MM-dd');

  return (
    <div>
      <label htmlFor="date" className="block text-sm font-semibold text-amber-900 mb-2">
        🗓️ Date
      </label>
      <input
        type="text"
        id="date"
        value={dateInputValue}
        onChange={handleDateChange}
        placeholder="MM-DD"
        pattern="[0-1][0-9]-[0-3][0-9]"
        className="input-field text-center font-mono"
        disabled={disabled}
      />
      <p className="text-xs text-amber-700 mt-2 text-center">
        ✨ Historical rain for <span className="font-semibold">{format(selectedDate, 'MMMM d')}</span>
      </p>
    </div>
  );
} 