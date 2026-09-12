import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  ChevronDown,
  X,
  History,
  Check,
} from 'lucide-react';

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
  const [showCenterPicker, setShowCenterPicker] = useState(false);
  const [customInputVal, setCustomInputVal] = useState(selectedDate);

  const centerDateInputRef = useRef<HTMLInputElement>(null);
  const centerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomInputVal(selectedDate);
  }, [selectedDate]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (centerContainerRef.current && !centerContainerRef.current.contains(e.target as Node)) {
        setShowCenterPicker(false);
      }
    };
    if (showCenterPicker) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showCenterPicker]);

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

  // Format friendly date: e.g. "Sat, Sep 12, 2026"
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

  const formatShortDate = (dateStr: string): string => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Open the date picker (tries native showPicker, also opens dropdown)
  const handleOpenCenterPicker = () => {
    if (disabled) return;

    // Try native browser date picker first
    if (centerDateInputRef.current && typeof centerDateInputRef.current.showPicker === 'function') {
      try {
        centerDateInputRef.current.showPicker();
      } catch (e) {
        console.warn('showPicker not allowed, showing popover:', e);
      }
    }
    // Toggle popover as well so it's always accessible
    setShowCenterPicker((prev) => !prev);
  };

  const handleApplyDate = (newDate: string) => {
    if (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      onChangeDate(newDate);
      setShowCenterPicker(false);
    }
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 relative">
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

      {/* Date Stepper & Interactive Date Picker */}
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

        {/* The Date Picker Box (Anchored Popover + Native Date Picker) */}
        <div className="relative" ref={centerContainerRef}>
          <button
            type="button"
            onClick={handleOpenCenterPicker}
            disabled={disabled}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] hover:bg-[#161b22] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] rounded-lg transition-all cursor-pointer group shadow-sm text-left"
            title="Click here to open the date picker and select any date"
          >
            <CalendarIcon className="w-4 h-4 text-[#58a6ff] group-hover:scale-110 transition-transform" />
            <span className="text-xs sm:text-sm font-semibold text-[#f0f6fc] tracking-wide select-none">
              {formatFriendlyDate(selectedDate)}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8b949e] group-hover:text-[#58a6ff] transition-colors" />
          </button>

          {/* Hidden native date input for browser showPicker support */}
          <input
            ref={centerDateInputRef}
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) handleApplyDate(e.target.value);
            }}
            disabled={disabled}
            className="sr-only"
            tabIndex={-1}
          />

          {/* Date Picker Popover Dropdown directly anchored beneath the box */}
          {showCenterPicker && (
            <div className="absolute top-full right-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 w-72 sm:w-80 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-4 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#30363d]">
                <span className="text-xs font-bold text-[#f0f6fc] flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-[#58a6ff]" />
                  Select Date
                </span>
                <button
                  type="button"
                  onClick={() => setShowCenterPicker(false)}
                  className="text-[#8b949e] hover:text-[#c9d1d9] p-0.5 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Date Input */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] text-[#8b949e] font-medium mb-1.5">
                    Pick any date to load from GitHub:
                  </label>
                  <input
                    type="date"
                    value={customInputVal}
                    onChange={(e) => {
                      setCustomInputVal(e.target.value);
                      if (e.target.value) handleApplyDate(e.target.value);
                    }}
                    className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] outline-none [color-scheme:dark] cursor-pointer transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleApplyDate(todayStr)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs font-medium text-[#c9d1d9] border border-[#30363d] transition-colors"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyDate(yesterdayStr)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs font-medium text-[#c9d1d9] border border-[#30363d] transition-colors"
                  >
                    Yesterday
                  </button>
                </div>

                {/* Dates with tasks recorded in GitHub */}
                {availableDates.length > 0 && (
                  <div className="pt-3 border-t border-[#21262d]">
                    <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider block mb-2 flex items-center gap-1">
                      <History className="w-3 h-3 text-[#58a6ff]" />
                      Recorded Dates on GitHub
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {availableDates.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handleApplyDate(d)}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                            selectedDate === d
                              ? 'bg-[#238636] text-white font-semibold shadow-sm'
                              : 'bg-[#0d1117] text-[#c9d1d9] hover:bg-[#30363d] border border-[#30363d]'
                          }`}
                        >
                          {selectedDate === d && <Check className="w-3 h-3 stroke-[3]" />}
                          <span>{formatShortDate(d)}</span>
                          <span className="text-[9px] opacity-70">({d.slice(0, 4)})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
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
