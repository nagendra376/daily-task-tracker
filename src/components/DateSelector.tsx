import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

interface DateSelectorProps {
  selectedDate: string;
  availableDates: string[];
  onChangeDate: (date: string) => void;
  disabled?: boolean;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  availableDates,
  onChangeDate,
  disabled = false,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Compute today's date in local YYYY-MM-DD format
  const getTodayStr = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Compute yesterday's date in local YYYY-MM-DD format
  const getYesterdayStr = (): string => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayStr();
  const yesterdayStr = getYesterdayStr();

  const isToday = selectedDate === todayStr;
  const isYesterday = selectedDate === yesterdayStr;

  // Step backward or forward by N days
  const stepDate = (offsetDays: number) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + offsetDays);

    const nextYear = date.getFullYear();
    const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
    const nextDay = String(date.getDate()).padStart(2, '0');
    onChangeDate(`${nextYear}-${nextMonth}-${nextDay}`);
  };

  // Format friendly label: e.g. "Sat, Sep 12, 2026"
  const formatFriendlyDate = (dateStr: string): string => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Trigger the native date picker cleanly
  const handleOpenDatePicker = () => {
    if (disabled) return;
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        try {
          dateInputRef.current.showPicker();
        } catch (err) {
          dateInputRef.current.focus();
        }
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
      {/* Quick Select Buttons */}
      <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
        <button
          onClick={() => onChangeDate(todayStr)}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            isToday
              ? 'bg-[#238636] text-white shadow-sm'
              : 'bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d] border border-[#30363d]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Today
        </button>

        <button
          onClick={() => onChangeDate(yesterdayStr)}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
            isYesterday
              ? 'bg-[#238636] text-white shadow-sm'
              : 'bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d] border border-[#30363d]'
          }`}
        >
          Yesterday
        </button>

        {/* Selected Date Tag if past */}
        {!isToday && !isYesterday && (
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/40 shrink-0">
            Past Date
          </span>
        )}
      </div>

      {/* Date Stepper & Date Picker */}
      <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto">
        {/* Previous Day Button */}
        <button
          onClick={() => stepDate(-1)}
          disabled={disabled}
          title="Previous day"
          className="p-1.5 rounded-lg bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d] border border-[#30363d] transition-colors disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Single Clean Date Picker Box */}
        <div className="relative">
          <button
            type="button"
            onClick={handleOpenDatePicker}
            disabled={disabled}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] hover:bg-[#161b22] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] rounded-lg transition-all cursor-pointer group shadow-sm text-left"
            title="Click to open calendar and select date"
          >
            <CalendarIcon className="w-4 h-4 text-[#58a6ff] group-hover:scale-110 transition-transform" />
            <span className="text-xs sm:text-sm font-semibold text-[#f0f6fc] tracking-wide select-none">
              {formatFriendlyDate(selectedDate)}
            </span>
          </button>

          {/* Native HTML5 date input triggered solely by showPicker() */}
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) {
                onChangeDate(e.target.value);
              }
            }}
            disabled={disabled}
            className="sr-only"
            tabIndex={-1}
          />
        </div>

        {/* Next Day Button */}
        <button
          onClick={() => stepDate(1)}
          disabled={disabled}
          title="Next day"
          className="p-1.5 rounded-lg bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d] border border-[#30363d] transition-colors disabled:opacity-40"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Available Dates Count Badge */}
        {availableDates.length > 0 && (
          <span
            title={`${availableDates.length} recorded daily log(s) in repository`}
            className="hidden lg:inline-flex items-center text-[11px] text-[#8b949e] ml-2 px-2 py-1 rounded bg-[#21262d] border border-[#30363d]"
          >
            {availableDates.length} log{availableDates.length === 1 ? '' : 's'} on GitHub
          </span>
        )}
      </div>
    </div>
  );
};
