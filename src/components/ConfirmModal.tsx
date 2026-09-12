import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { Task } from '../types/task';

interface ConfirmModalProps {
  isOpen: boolean;
  task: Task | null;
  targetDate: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  task,
  targetDate,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 text-[#f85149] mb-3">
            <div className="w-10 h-10 rounded-full bg-[#f85149]/10 border border-[#f85149]/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f0f6fc]">Delete Task</h3>
              <p className="text-xs text-[#8b949e]">This action commits directly to GitHub</p>
            </div>
          </div>

          <p className="text-sm text-[#c9d1d9] mb-3">
            Are you sure you want to delete this task from{' '}
            <strong className="text-[#58a6ff]">{targetDate}</strong>?
          </p>

          <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-lg mb-4 text-xs">
            <p className="font-semibold text-[#f0f6fc] truncate">{task.task}</p>
            {task.description && (
              <p className="text-[#8b949e] truncate mt-0.5">{task.description}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-xs font-medium rounded-lg text-[#c9d1d9] hover:bg-[#21262d] border border-[#30363d] transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#da3633] hover:bg-[#b62324] text-white shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting task...</span>
                </>
              ) : (
                <span>Delete Task</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
