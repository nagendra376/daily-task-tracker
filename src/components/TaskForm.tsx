import React, { useState, useEffect } from 'react';
import { X, Loader2, Plus, Edit3 } from 'lucide-react';
import type { Task, TaskStatus } from '../types/task';

interface TaskFormProps {
  isOpen: boolean;
  isEditing: boolean;
  initialTask?: Task | null;
  targetDate: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: { task: string; description: string; status: TaskStatus }) => Promise<void>;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  isEditing,
  initialTask,
  targetDate,
  isSaving,
  onClose,
  onSubmit,
}) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (initialTask && isEditing) {
      setTaskTitle(initialTask.task);
      setDescription(initialTask.description || '');
      setStatus(initialTask.status || 'pending');
    } else {
      setTaskTitle('');
      setDescription('');
      setStatus('pending');
    }
    setValidationError('');
  }, [initialTask, isEditing, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = taskTitle.trim();
    if (!cleanTitle) {
      setValidationError('Please enter a task title.');
      return;
    }

    try {
      await onSubmit({
        task: cleanTitle,
        description: description.trim(),
        status,
      });
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save task.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d]">
          <div className="flex items-center gap-2 text-[#f0f6fc]">
            {isEditing ? (
              <Edit3 className="w-5 h-5 text-[#58a6ff]" />
            ) : (
              <Plus className="w-5 h-5 text-[#3fb950]" />
            )}
            <h2 className="text-base sm:text-lg font-bold">
              {isEditing ? 'Edit Task' : 'Add New Task'}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1 rounded-lg text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Date Display */}
          <div className="text-xs text-[#8b949e] bg-[#0d1117] px-3 py-2 rounded-lg border border-[#30363d]">
            Target Date: <span className="font-semibold text-[#58a6ff]">{targetDate}</span>
            <span className="block text-[11px] text-[#8b949e] mt-0.5">
              Will commit directly to <code className="text-xs">tasks/{targetDate}.json</code>
            </span>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-3 bg-[#f85149]/10 border border-[#f85149]/30 rounded-lg text-xs text-[#f85149]">
              {validationError}
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className="block text-xs font-semibold text-[#c9d1d9] uppercase tracking-wider mb-1.5">
              Task Title <span className="text-[#f85149]">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              disabled={isSaving}
              value={taskTitle}
              onChange={(e) => {
                setTaskTitle(e.target.value);
                if (validationError) setValidationError('');
              }}
              placeholder="e.g. Worked on SSO POC"
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] text-[#f0f6fc] text-sm rounded-lg px-3.5 py-2.5 outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#c9d1d9] uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              disabled={isSaving}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, steps completed, or blockers..."
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] text-[#f0f6fc] text-sm rounded-lg px-3.5 py-2.5 outline-none transition-colors resize-none"
            />
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#c9d1d9] uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={status}
              disabled={isSaving}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] text-[#f0f6fc] text-sm rounded-lg px-3 py-2.5 outline-none transition-colors cursor-pointer"
            >
              <option value="pending">Pending (To-Do)</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#30363d]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-medium rounded-lg text-[#c9d1d9] hover:bg-[#21262d] border border-[#30363d] transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to GitHub...</span>
                </>
              ) : (
                <span>{isEditing ? 'Save Changes' : 'Add Task'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
