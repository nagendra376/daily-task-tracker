import React, { useState } from 'react';
import { Plus, ClipboardList, Loader2, FileText, Send } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { Task, TaskStatus } from '../types/task';

interface TaskListProps {
  tasks: Task[];
  date: string;
  isLoading: boolean;
  isSaving: boolean;
  onAddTask: () => void;
  onQuickAdd: (content: string) => Promise<void>;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  date,
  isLoading,
  isSaving,
  onAddTask,
  onQuickAdd,
  onEditTask,
  onDeleteTask,
}) => {
  const [quickNote, setQuickNote] = useState('');

  const getTodayStr = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isToday = date === getTodayStr();

  const formatHeading = (dateStr: string) => {
    if (isToday) return "Today's Notepad";
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return `Notepad — ${d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;
    } catch {
      return `Notepad — ${dateStr}`;
    }
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = quickNote.trim();
    if (!text || isSaving) return;
    try {
      await onQuickAdd(text);
      setQuickNote('');
    } catch (err) {
      // Handled by parent
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#30363d]">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-[#58a6ff]" />
          <h2 className="text-lg sm:text-xl font-bold text-[#f0f6fc]">
            {formatHeading(date)}
          </h2>
          {tasks.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#21262d] text-[#8b949e] border border-[#30363d]">
              {tasks.length} {tasks.length === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>

        {/* Modal Add Button */}
        <button
          onClick={onAddTask}
          disabled={isSaving}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white border border-[#30363d] text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4 text-[#3fb950]" />
          <span>New Note (Full Modal)</span>
        </button>
      </div>

      {/* Inline Quick Notepad Box */}
      <div className="bg-[#161b22] border border-[#30363d] focus-within:border-[#58a6ff] rounded-2xl p-4 shadow-sm transition-all">
        <form onSubmit={handleQuickSubmit} className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#8b949e]">
            <span className="font-semibold text-[#c9d1d9] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#238636]" />
              Quick Notepad
            </span>
            <span>Commits to GitHub</span>
          </div>

          <textarea
            rows={4}
            disabled={isSaving}
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            placeholder="Write what you worked on today... (e.g. Worked on SSO POC, tested authentication flow)"
            className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] rounded-xl p-3 text-sm text-[#f0f6fc] placeholder-[#8b949e] outline-none transition-colors resize-y leading-relaxed font-sans"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-[#8b949e]">
              Press Save to commit directly to <code className="text-[#58a6ff]">tasks/{date}.json</code>
            </span>

            <button
              type="submit"
              disabled={isSaving || !quickNote.trim()}
              className="px-4 py-2 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-40"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Save to GitHub</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-3 py-6">
          <div className="flex items-center justify-center gap-2 text-sm text-[#8b949e]">
            <Loader2 className="w-4 h-4 animate-spin text-[#58a6ff]" />
            <span>Loading notes from GitHub...</span>
          </div>
          <div className="h-24 bg-[#161b22] border border-[#30363d] rounded-xl animate-pulse" />
        </div>
      ) : tasks.length === 0 ? (
        /* Empty State */
        <div className="py-10 px-4 text-center rounded-2xl border border-dashed border-[#30363d] bg-[#161b22]/30">
          <div className="w-11 h-11 mx-auto mb-2 rounded-full bg-[#21262d] flex items-center justify-center text-[#8b949e]">
            <ClipboardList className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-[#f0f6fc] mb-1">
            No notes for this date yet
          </h3>
          <p className="text-xs text-[#8b949e] max-w-sm mx-auto">
            Use the notepad above to type what you accomplished and save it directly to GitHub.
          </p>
        </div>
      ) : (
        /* Note Cards */
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
            Saved Notes on GitHub
          </h4>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isSaving={isSaving}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}
        </div>
      )}
    </div>
  );
};
