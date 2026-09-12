import React from 'react';
import { Check, Clock, AlertCircle, Edit2, Trash2, Calendar } from 'lucide-react';
import type { Task } from '../types/task';

interface TaskCardProps {
  task: Task;
  isSaving: boolean;
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isSaving,
  onToggleStatus,
  onEdit,
  onDelete,
}) => {
  const isCompleted = task.status === 'completed';
  const isInProgress = task.status === 'in-progress';

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div
      className={`group bg-[#161b22] border rounded-xl p-4 transition-all duration-200 shadow-sm ${
        isCompleted
          ? 'border-[#238636]/40 bg-[#161b22]/90'
          : isInProgress
          ? 'border-[#1f6feb]/50'
          : 'border-[#30363d] hover:border-[#8b949e]'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Toggle Status Checkbox / Icon */}
        <button
          onClick={() => onToggleStatus(task)}
          disabled={isSaving}
          title={isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
          className={`mt-1 shrink-0 w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
            isCompleted
              ? 'bg-[#238636] border-[#238636] text-white hover:bg-[#2ea043]'
              : isInProgress
              ? 'border-[#1f6feb] bg-[#1f6feb]/10 text-[#58a6ff] hover:bg-[#1f6feb]/20'
              : 'border-[#30363d] hover:border-[#58a6ff] text-transparent hover:text-[#58a6ff]'
          } disabled:opacity-50`}
        >
          {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
          {!isCompleted && isInProgress && <Clock className="w-3.5 h-3.5" />}
          {!isCompleted && !isInProgress && <Check className="w-3.5 h-3.5" />}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {/* Status Badge */}
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isCompleted
                  ? 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30'
                  : isInProgress
                  ? 'bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30'
                  : 'bg-[#30363d] text-[#8b949e] border border-[#30363d]'
              }`}
            >
              {task.status}
            </span>

            {/* Created Timestamp */}
            {task.createdAt && (
              <span className="text-[11px] text-[#8b949e] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(task.createdAt)}
              </span>
            )}
          </div>

          {/* Task Title */}
          <h3
            className={`text-base font-semibold leading-snug break-words ${
              isCompleted ? 'line-through text-[#8b949e]' : 'text-[#f0f6fc]'
            }`}
          >
            {task.task}
          </h3>

          {/* Task Description */}
          {task.description && (
            <p className="mt-1.5 text-sm text-[#8b949e] leading-relaxed whitespace-pre-wrap break-words">
              {task.description}
            </p>
          )}

          {/* Action Buttons: [Edit] [Delete] */}
          <div className="mt-3 pt-2.5 border-t border-[#21262d] flex items-center justify-end gap-2">
            <button
              onClick={() => onEdit(task)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#c9d1d9] hover:text-[#58a6ff] hover:bg-[#21262d] rounded-md transition-colors disabled:opacity-40"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button
              onClick={() => onDelete(task)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#f85149] hover:bg-[#f85149]/10 rounded-md transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
