import React from 'react';
import { Clock, Edit2, Trash2, FileText } from 'lucide-react';
import type { Task } from '../types/task';

interface TaskCardProps {
  task: Task;
  isSaving: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isSaving,
  onEdit,
  onDelete,
}) => {
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Combine title and description if both exist from legacy entries, otherwise use task
  const noteContent =
    task.description && task.description !== task.task
      ? `${task.task}\n\n${task.description}`
      : task.task;

  return (
    <div className="group bg-[#161b22] border border-[#30363d] hover:border-[#58a6ff]/60 rounded-xl p-4 transition-all duration-200 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Note Icon */}
        <div className="mt-0.5 shrink-0 w-7 h-7 rounded-lg bg-[#21262d] border border-[#30363d] text-[#58a6ff] flex items-center justify-center">
          <FileText className="w-3.5 h-3.5" />
        </div>

        {/* Note Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            {task.createdAt && (
              <span className="text-[11px] text-[#8b949e] flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                {formatTime(task.createdAt)}
              </span>
            )}

            {/* Action Buttons: [Edit] [Delete] */}
            <div className="flex items-center gap-1 opacity-85 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(task)}
                disabled={isSaving}
                title="Edit in notepad"
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#c9d1d9] hover:text-[#58a6ff] hover:bg-[#21262d] rounded-md transition-colors disabled:opacity-40"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => onDelete(task)}
                disabled={isSaving}
                title="Delete note"
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#f85149] hover:bg-[#f85149]/10 rounded-md transition-colors disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Note Text Content */}
          <div className="text-sm text-[#f0f6fc] leading-relaxed whitespace-pre-wrap break-words font-sans selection:bg-[#238636]">
            {noteContent}
          </div>
        </div>
      </div>
    </div>
  );
};
