import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Calendar, Check, Clock, AlertCircle } from 'lucide-react';
import { taskService } from '../services/taskService';
import type { SearchResultItem } from '../types/task';

interface SearchBarProps {
  onSelectTaskDate: (date: string, taskId?: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSelectTaskDate }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      setIsOpen(false);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await taskService.searchTasks(trimmed);
        setResults(data.results || []);
        setHasSearched(true);
        setIsOpen(true);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setHasSearched(false);
  };

  const handleSelect = (date: string, taskId: string) => {
    onSelectTaskDate(date, taskId);
    setIsOpen(false);
  };

  const formatDateLabel = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-[#8b949e] pointer-events-none">
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#58a6ff]" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || hasSearched) setIsOpen(true);
          }}
          placeholder="Search tasks across titles, descriptions, dates..."
          className="w-full bg-[#161b22] border border-[#30363d] focus:border-[#58a6ff] text-[#c9d1d9] placeholder-[#8b949e] text-sm rounded-lg pl-9 pr-9 py-2 transition-all outline-none"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 text-[#8b949e] hover:text-[#c9d1d9] p-0.5 rounded transition-colors"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl max-h-96 overflow-y-auto z-40">
          <div className="p-2 border-b border-[#21262d] flex items-center justify-between text-xs text-[#8b949e]">
            <span>
              {results.length} result{results.length === 1 ? '' : 's'} for &quot;{query}&quot;
            </span>
            <span>Press ESC or click outside to dismiss</span>
          </div>

          {results.length === 0 && hasSearched && !isSearching && (
            <div className="p-6 text-center text-sm text-[#8b949e]">
              No tasks matched your search query.
            </div>
          )}

          <div className="divide-y divide-[#21262d]">
            {results.map((item) => {
              const isCompleted = item.task.status === 'completed';
              const isInProgress = item.task.status === 'in-progress';

              return (
                <button
                  key={`${item.date}-${item.task.id}`}
                  onClick={() => handleSelect(item.date, item.task.id)}
                  className="w-full text-left p-3 hover:bg-[#21262d]/80 transition-colors flex items-start gap-3 group"
                >
                  {/* Status icon */}
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <span className="w-5 h-5 rounded-full bg-[#238636]/20 text-[#3fb950] flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    ) : isInProgress ? (
                      <span className="w-5 h-5 rounded-full bg-[#1f6feb]/20 text-[#58a6ff] flex items-center justify-center">
                        <Clock className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-[#8b949e]/20 text-[#8b949e] flex items-center justify-center">
                        <AlertCircle className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Task details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-[#58a6ff] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateLabel(item.date)}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-medium bg-[#30363d] text-[#8b949e]">
                        {item.task.status}
                      </span>
                    </div>

                    <div className={`text-sm font-medium ${isCompleted ? 'line-through text-[#8b949e]' : 'text-[#f0f6fc]'} group-hover:text-white`}>
                      {item.task.task}
                    </div>

                    {item.task.description && (
                      <p className="text-xs text-[#8b949e] line-clamp-1 mt-0.5">
                        {item.task.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
