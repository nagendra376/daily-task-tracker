import React, { useMemo, useRef, useEffect } from 'react';
import { GitCommit, Calendar } from 'lucide-react';

interface ContributionGraphProps {
  selectedDate: string;
  activity: Record<string, number>;
  onSelectDate: (date: string) => void;
}

interface DayCell {
  dateStr: string;
  count: number;
  isFuture: boolean;
  dayOfWeek: number; // 0 = Sun, 6 = Sat
  monthName: string;
  dayOfMonth: number;
}

interface WeekCol {
  weekIndex: number;
  days: DayCell[];
  firstDayDate: Date;
}

export const ContributionGraph: React.FC<ContributionGraphProps> = ({
  selectedDate,
  activity,
  onSelectDate,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate 53 weeks ending on the current week's Saturday
  const { weeks, monthLabels, totalNotes } = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayDay = today.getDay(); // 0 (Sun) - 6 (Sat)

    // Current week ends on Saturday
    const endSaturday = new Date(today);
    endSaturday.setDate(today.getDate() + (6 - todayDay));

    // 52 weeks prior starting on Sunday (total 53 weeks)
    const startDate = new Date(endSaturday);
    startDate.setDate(endSaturday.getDate() - (53 * 7 - 1));

    const weeksList: WeekCol[] = [];
    let currentDayIter = new Date(startDate);
    let allNotesCount = 0;

    for (let w = 0; w < 53; w++) {
      const daysInWeek: DayCell[] = [];
      const colFirstDay = new Date(currentDayIter);

      for (let d = 0; d < 7; d++) {
        const year = currentDayIter.getFullYear();
        const month = String(currentDayIter.getMonth() + 1).padStart(2, '0');
        const day = String(currentDayIter.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const isFuture = dateStr > todayStr;
        const count = !isFuture ? (activity[dateStr] || 0) : 0;
        allNotesCount += count;

        daysInWeek.push({
          dateStr,
          count,
          isFuture,
          dayOfWeek: d,
          monthName: currentDayIter.toLocaleString('default', { month: 'short' }),
          dayOfMonth: currentDayIter.getDate(),
        });

        // Advance by 1 day
        currentDayIter.setDate(currentDayIter.getDate() + 1);
      }

      weeksList.push({
        weekIndex: w,
        days: daysInWeek,
        firstDayDate: colFirstDay,
      });
    }

    // Determine month label positions
    const labels: { month: string; colIndex: number }[] = [];
    let lastMonth = '';

    weeksList.forEach((col, idx) => {
      // Find if any day in this week is the 1st - 7th of a new month
      const firstOfMonthDay = col.days.find((d) => d.dayOfMonth >= 1 && d.dayOfMonth <= 7 && !d.isFuture);
      if (firstOfMonthDay && firstOfMonthDay.monthName !== lastMonth) {
        labels.push({
          month: firstOfMonthDay.monthName,
          colIndex: idx,
        });
        lastMonth = firstOfMonthDay.monthName;
      }
    });

    return {
      weeks: weeksList,
      monthLabels: labels,
      totalNotes: allNotesCount,
    };
  }, [activity]);

  // Scroll to the right on load so the current week is immediately visible
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  // Compute color level based on task/note count
  const getCellColor = (count: number, isFuture: boolean, isSelected: boolean) => {
    if (isFuture) {
      return 'bg-transparent opacity-0 pointer-events-none';
    }
    if (isSelected) {
      return 'bg-[#39d353] ring-2 ring-white ring-offset-1 ring-offset-[#0d1117] shadow-md';
    }
    if (count === 0) {
      return 'bg-[#161b22] border border-[#21262d] hover:border-[#8b949e]';
    }
    if (count === 1) {
      return 'bg-[#0e4429] border border-[#006d32]/40 hover:border-[#26a641]';
    }
    if (count === 2) {
      return 'bg-[#006d32] border border-[#26a641]/50 hover:border-[#39d353]';
    }
    if (count === 3) {
      return 'bg-[#26a641] border border-[#39d353]/60 hover:brightness-110';
    }
    return 'bg-[#39d353] border border-[#39d353] hover:brightness-110';
  };

  const formatTooltip = (dateStr: string, count: number) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      const formatted = d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return count === 0
        ? `No notes on ${formatted}`
        : `${count} note${count === 1 ? '' : 's'} on ${formatted}`;
    } catch {
      return `${count} notes on ${dateStr}`;
    }
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-[#39d353]" />
          <h3 className="text-sm font-semibold text-[#f0f6fc]">
            Daily Note Activity
          </h3>
          <span className="text-xs text-[#8b949e]">
            ({totalNotes} {totalNotes === 1 ? 'note' : 'notes'} recorded in GitHub)
          </span>
        </div>
        <span className="text-[11px] text-[#8b949e] flex items-center gap-1">
          <Calendar className="w-3 h-3 text-[#58a6ff]" />
          Click any square to view or write for that date
        </span>
      </div>

      {/* Heatmap Grid Container (Scrollable) */}
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-[#30363d]"
      >
        <div className="inline-block min-w-max">
          {/* Months Header Row */}
          <div className="flex text-[10px] text-[#8b949e] h-4 mb-1 select-none pl-7">
            {weeks.map((col, colIdx) => {
              const label = monthLabels.find((l) => l.colIndex === colIdx);
              return (
                <div key={col.weekIndex} className="w-[14px] mr-[3px] shrink-0 relative">
                  {label && (
                    <span className="absolute left-0 top-0 whitespace-nowrap font-medium text-[#c9d1d9]">
                      {label.month}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grid with Day-of-Week Labels */}
          <div className="flex">
            {/* Days of week labels on left (Mon, Wed, Fri) */}
            <div className="flex flex-col justify-between text-[9px] text-[#8b949e] pr-2 select-none h-[116px] py-[2px]">
              <span className="opacity-0">Sun</span>
              <span>Mon</span>
              <span className="opacity-0">Tue</span>
              <span>Wed</span>
              <span className="opacity-0">Thu</span>
              <span>Fri</span>
              <span className="opacity-0">Sat</span>
            </div>

            {/* Week Columns */}
            <div className="flex gap-[3px]">
              {weeks.map((week) => (
                <div key={week.weekIndex} className="flex flex-col gap-[3px]">
                  {week.days.map((day) => {
                    const isSelected = day.dateStr === selectedDate;
                    const cellColor = getCellColor(day.count, day.isFuture, isSelected);

                    return (
                      <button
                        key={day.dateStr}
                        type="button"
                        onClick={() => {
                          if (!day.isFuture) {
                            onSelectDate(day.dateStr);
                          }
                        }}
                        disabled={day.isFuture}
                        title={day.isFuture ? '' : `${formatTooltip(day.dateStr, day.count)} — Click to view`}
                        className={`w-[13px] h-[13px] rounded-[2.5px] transition-all duration-150 cursor-pointer ${cellColor}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Legend */}
      <div className="flex items-center justify-between text-[11px] text-[#8b949e] pt-1 border-t border-[#21262d]">
        <span>
          Selected: <strong className="text-[#58a6ff]">{selectedDate}</strong>
        </span>

        {/* Legend */}
        <div className="flex items-center gap-1.5 select-none">
          <span>Less</span>
          <div className="w-[11px] h-[11px] rounded-[2px] bg-[#161b22] border border-[#21262d]" title="0 notes" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-[#0e4429] border border-[#006d32]/40" title="1 note" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-[#006d32] border border-[#26a641]/50" title="2 notes" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-[#26a641] border border-[#39d353]/60" title="3 notes" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-[#39d353] border border-[#39d353]" title="4+ notes" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
};
