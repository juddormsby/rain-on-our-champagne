
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
      onDateChange(new Date(dateStr));
    }
  };

  const dateInputValue = format(selectedDate, 'yyyy-MM-dd');

  return (
    <div>
      <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
        Date
      </label>
      <input
        type="date"
        id="date"
        value={dateInputValue}
        onChange={handleDateChange}
        className="input-field"
        disabled={disabled}
      />
      <p className="text-xs text-gray-500 mt-1">
        Historical rain probability for {format(selectedDate, 'MMMM d')}
      </p>
    </div>
  );
} 