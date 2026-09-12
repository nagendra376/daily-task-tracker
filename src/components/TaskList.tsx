import React from 'react';
import { Plus, CheckCircle2, ClipboardList, Loader2 } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { Task } from '../types/task';

interface TaskListProps {
  tasks: Task[];
  date: string;
  isLoading: boolean;
  isSaving: boolean;
  onAddTask: () => void;
  onToggleStatus: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  date,
  isLoading,
  isSaving,
  onAddTask,
  onToggleStatus,
  onEditTask,
  onDeleteTask,
}) => {
  const getTodayStr = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isToday = date === getTodayStr();

  const formatHeading = (dateStr: string) => {
    if (isToday) return "Today's Tasks";
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return `Tasks for ${d.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}`;
    } catch {
      return `Tasks for ${dateStr}`;
    }
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Section Header & Add Task Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#30363d]">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#f0f6fc] flex items-center gap-2">
            {formatHeading(date)}
            {totalCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                {completedCount}/{totalCount}
              </span>
            )}
          </h2>
          {totalCount > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 sm:w-32 bg-[#21262d] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#238636] h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[11px] text-[#8b949e]">{progressPercent}% done</span>
            </div>
          )}
        </div>

        {/* Top Add Task Button */}
        <button
          onClick={onAddTask}
          disabled={isSaving}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white text-xs sm:text-sm font-semibold shadow-sm flex items-center gap-2 transition-all hover:shadow hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Add Task</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-3 py-6">
          <div className="flex items-center justify-center gap-2 text-sm text-[#8b949e]">
            <Loader2 className="w-4 h-4 animate-spin text-[#58a6ff]" />
            <span>Loading tasks from GitHub...</span>
          </div>
          <div className="h-20 bg-[#161b22] border border-[#30363d] rounded-xl animate-pulse" />
          <div className="h-20 bg-[#161b22] border border-[#30363d] rounded-xl animate-pulse opacity-60" />
        </div>
      ) : totalCount === 0 ? (
        /* Empty State */
        <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-[#30363d] bg-[#161b22]/40">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#21262d] flex items-center justify-center text-[#8b949e]">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-[#f0f6fc] mb-1">
            No tasks recorded for this date
          </h3>
          <p className="text-xs text-[#8b949e] max-w-sm mx-auto mb-5">
            Keep track of what you accomplished. Your entries will be automatically committed to{' '}
            <code className="text-[#58a6ff]">tasks/{date}.json</code> in GitHub.
          </p>
          <button
            onClick={onAddTask}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Task</span>
          </button>
        </div>
      ) : (
        /* Task Cards */
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isSaving={isSaving}
              onToggleStatus={onToggleStatus}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}
        </div>
      )}
    </div>
  );
};
