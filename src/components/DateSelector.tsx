import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, ArrowRight, Check, History } from 'lucide-react';

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
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customInputDate, setCustomInputDate] = useState(selectedDate);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Keep customInputDate in sync with selectedDate
  useEffect(() => {
    setCustomInputDate(selectedDate);
  }, [selectedDate]);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowCustomModal(false);
      }
    };
    if (showCustomModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomModal]);

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
  const isCustom = !isToday && !isYesterday;

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

  // Format nice friendly label: e.g. "12 Sep 2026"
  const formatFriendlyDate = (dateStr: string): string => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
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
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const handleApplyCustomDate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (customInputDate && /^\d{4}-\d{2}-\d{2}$/.test(customInputDate)) {
      onChangeDate(customInputDate);
      setShowCustomModal(false);
    }
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 relative">
      {/* Quick Select Buttons */}
      <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
        {/* Today Button */}
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

        {/* Yesterday Button */}
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

        {/* Custom Date Select Button */}
        <div className="relative shrink-0" ref={popoverRef}>
          <button
            onClick={() => setShowCustomModal((prev) => !prev)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
              isCustom
                ? 'bg-[#238636] text-white shadow-sm ring-1 ring-[#3fb950]'
                : 'bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d] border border-[#30363d]'
            }`}
            title="Pick any custom date to fetch and view tasks"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>{isCustom ? formatShortDate(selectedDate) : 'Custom Date'}</span>
          </button>

          {/* Custom Date Popover Dialog */}
          {showCustomModal && (
            <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-4 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#30363d]">
                <h4 className="text-xs font-bold text-[#f0f6fc] flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#58a6ff]" />
                  Select Custom Date
                </h4>
                <span className="text-[10px] text-[#8b949e]">Loads from GitHub</span>
              </div>

              <form onSubmit={handleApplyCustomDate} className="space-y-3">
                <div>
                  <label className="block text-[11px] text-[#8b949e] font-medium mb-1">
                    Choose Date
                  </label>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={customInputDate}
                    onChange={(e) => setCustomInputDate(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] outline-none transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-3 py-2 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>Fetch Tasks</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    className="px-3 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-xs font-medium border border-[#30363d] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              {/* Recorded Dates on GitHub */}
              {availableDates.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#21262d]">
                  <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <History className="w-3 h-3 text-[#58a6ff]" />
                    Recorded Dates on GitHub
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {availableDates.slice(0, 10).map((date) => (
                      <button
                        key={date}
                        type="button"
                        onClick={() => {
                          onChangeDate(date);
                          setShowCustomModal(false);
                        }}
                        className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                          selectedDate === date
                            ? 'bg-[#1f6feb] text-white font-bold'
                            : 'bg-[#0d1117] text-[#c9d1d9] hover:bg-[#30363d] border border-[#30363d]'
                        }`}
                      >
                        {formatShortDate(date)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Date Stepper & Picker Display */}
      <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto">
        <button
          onClick={() => stepDate(-1)}
          disabled={disabled}
          title="Previous day"
          className="p-1.5 rounded-lg bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d] border border-[#30363d] transition-colors disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Date Display and Native Picker */}
        <div className="relative flex items-center gap-2 px-3 py-1.5 bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] rounded-lg transition-colors cursor-pointer group">
          <CalendarIcon className="w-4 h-4 text-[#58a6ff]" />
          <span className="text-xs sm:text-sm font-semibold text-[#f0f6fc] tracking-wide select-none">
            {formatFriendlyDate(selectedDate)}
          </span>

          {/* Native date picker input overlay */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) onChangeDate(e.target.value);
            }}
            disabled={disabled}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            title="Click to pick any date"
          />
        </div>

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
