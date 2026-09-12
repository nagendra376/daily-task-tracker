import React, { useState, useEffect } from 'react';
import { X, Loader2, FileText, CheckCircle2 } from 'lucide-react';
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
  const [content, setContent] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (initialTask && isEditing) {
      // If task had both title and description, combine them or use task content
      const fullText = initialTask.description && initialTask.description !== initialTask.task
        ? `${initialTask.task}\n\n${initialTask.description}`
        : initialTask.task;
      setContent(fullText);
    } else {
      setContent('');
    }
    setValidationError('');
  }, [initialTask, isEditing, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanContent = content.trim();
    if (!cleanContent) {
      setValidationError('Please write some content in your notepad note.');
      return;
    }

    try {
      await onSubmit({
        task: cleanContent,
        description: '',
        status: 'completed',
      });
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save note to GitHub.');
    }
  };

  const lineCount = content.split('\n').length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d] bg-[#161b22]">
          <div className="flex items-center gap-2.5 text-[#f0f6fc]">
            <div className="w-8 h-8 rounded-lg bg-[#238636]/20 border border-[#238636]/40 flex items-center justify-center text-[#3fb950]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                {isEditing ? 'Edit Notepad Entry' : 'Daily Notepad'}
              </h2>
              <span className="text-xs text-[#8b949e]">
                Date: <strong className="text-[#58a6ff]">{targetDate}</strong> &bull; auto-commits to GitHub
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notepad Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          {validationError && (
            <div className="p-3 bg-[#f85149]/10 border border-[#f85149]/30 rounded-lg text-xs text-[#f85149]">
              {validationError}
            </div>
          )}

          {/* Notepad Area */}
          <div className="relative">
            <textarea
              rows={10}
              required
              autoFocus
              disabled={isSaving}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (validationError) setValidationError('');
              }}
              placeholder={`Write what you worked on today...\n\nExample:\n- Worked on SSO POC\n- Tested Microsoft authentication flow and verified token exchange\n- Deployed changes to staging`}
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] text-[#f0f6fc] text-sm font-sans rounded-xl p-4 outline-none transition-all resize-y leading-relaxed"
            />
          </div>

          {/* Bottom Bar: Stats and Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-[#8b949e]">
              {wordCount} {wordCount === 1 ? 'word' : 'words'} &bull; {lineCount} {lineCount === 1 ? 'line' : 'lines'}
            </span>

            <div className="flex items-center gap-3">
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
                disabled={isSaving || !content.trim()}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to GitHub...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save to GitHub</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
