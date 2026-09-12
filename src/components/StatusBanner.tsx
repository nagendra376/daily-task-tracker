import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface StatusBannerProps {
  message: string | null;
  type?: 'error' | 'success' | 'info';
  onDismiss: () => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  message,
  type = 'error',
  onDismiss,
}) => {
  if (!message) return null;

  const isError = type === 'error';
  const isSuccess = type === 'success';

  return (
    <div
      className={`rounded-xl p-3.5 border shadow-sm flex items-start gap-3 transition-all ${
        isError
          ? 'bg-[#f85149]/10 border-[#f85149]/40 text-[#ff7b72]'
          : isSuccess
          ? 'bg-[#238636]/10 border-[#238636]/40 text-[#3fb950]'
          : 'bg-[#1f6feb]/10 border-[#1f6feb]/40 text-[#58a6ff]'
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {isError && <AlertCircle className="w-4 h-4 text-[#f85149]" />}
        {isSuccess && <CheckCircle2 className="w-4 h-4 text-[#3fb950]" />}
      </div>

      <div className="flex-1 text-xs sm:text-sm font-medium leading-normal break-words">
        {message}
      </div>

      <button
        onClick={onDismiss}
        className="p-1 rounded hover:bg-black/20 text-current opacity-70 hover:opacity-100 transition-opacity"
        title="Dismiss message"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
