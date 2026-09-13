import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ContributionGraph } from './components/ContributionGraph';
import { DateSelector } from './components/DateSelector';
import { TaskList } from './components/TaskList';
import { TaskForm } from './components/TaskForm';
import { ConfirmModal } from './components/ConfirmModal';
import { StatusBanner } from './components/StatusBanner';
import { ConfigModal } from './components/ConfigModal';
import { taskService } from './services/taskService';
import type { Task, TaskStatus, RepoHealth } from './types/task';

export const App: React.FC = () => {
  // Helper to format today's date in local YYYY-MM-DD
  const getTodayDateString = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [activity, setActivity] = useState<Record<string, number>>({});
  const [health, setHealth] = useState<RepoHealth | null>(null);

  // Loading & operation states
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState<string | null>(null);

  // Notification banners
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Fetch health / connection status
  const fetchHealth = useCallback(async () => {
    try {
      const data = await taskService.checkHealth();
      setHealth(data);
      if (!data.configured) {
        setErrorMessage('GitHub credentials not configured. Click "Configure GitHub" to set up your repository.');
      } else if (!data.connected) {
        setErrorMessage(data.error || 'Unable to connect to GitHub. Please verify your token and repo name.');
      }
    } catch (err: any) {
      console.error('Health check error:', err);
      setErrorMessage('Backend server is not responding. Please check your local server process.');
    }
  }, []);

  // Fetch available dates and activity counts from GitHub
  const fetchAvailableDates = useCallback(async () => {
    try {
      const data = await taskService.getAvailableDates();
      setAvailableDates(data.dates);
      setActivity(data.activity);
    } catch (err) {
      console.warn('Failed to list available dates:', err);
    }
  }, []);

  // Fetch tasks for currently selected date
  const loadTasksForDate = useCallback(async (dateToLoad: string) => {
    setIsLoadingTasks(true);
    setSyncStatusText('Loading tasks from GitHub...');
    try {
      const data = await taskService.getTasks(dateToLoad);
      setTasks(data.tasks || []);
    } catch (err: any) {
      console.error('Load tasks error:', err);
      setErrorMessage(err.message || 'Failed to load tasks from GitHub.');
      setTasks([]);
    } finally {
      setIsLoadingTasks(false);
      setSyncStatusText(null);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchHealth();
    fetchAvailableDates();
    loadTasksForDate(selectedDate);
  }, [fetchHealth, fetchAvailableDates, loadTasksForDate, selectedDate]);

  // Handle date change
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Add Task
  const handleOpenAddForm = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  // Edit Task
  const handleOpenEditForm = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  // Quick Add note directly from inline notepad
  const handleQuickAdd = async (noteContent: string) => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setSyncStatusText('Saving note to GitHub...');

    try {
      const res = await taskService.addTask({
        date: selectedDate,
        task: noteContent,
        description: '',
        status: 'completed',
      });
      setTasks((prev) => [...prev, res.task]);
      setSuccessMessage(`Saved note and committed to GitHub.`);
      fetchAvailableDates();
    } catch (err: any) {
      const msg = err.message || 'Unable to save note to GitHub. Please check your connection.';
      setErrorMessage(msg);
      throw err;
    } finally {
      setIsSaving(false);
      setSyncStatusText(null);
    }
  };

  // Submit Task Form (Add or Edit modal)
  const handleFormSubmit = async (formData: { task: string; description: string; status: TaskStatus }) => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setSyncStatusText('Saving to GitHub...');

    try {
      if (editingTask) {
        // Edit
        const res = await taskService.updateTask(editingTask.id, {
          date: selectedDate,
          task: formData.task,
          description: formData.description,
          status: formData.status,
        });
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? res.task : t)));
        setSuccessMessage(`Updated note and committed to GitHub.`);
      } else {
        // Add
        const res = await taskService.addTask({
          date: selectedDate,
          task: formData.task,
          description: formData.description,
          status: formData.status,
        });
        setTasks((prev) => [...prev, res.task]);
        setSuccessMessage(`Saved note and committed to GitHub.`);
        fetchAvailableDates();
      }
    } catch (err: any) {
      const msg = err.message || 'Unable to save note to GitHub. Please check your GitHub connection and try again.';
      setErrorMessage(msg);
      throw err;
    } finally {
      setIsSaving(false);
      setSyncStatusText(null);
    }
  };

  // Open Delete Confirmation
  const handleOpenDeleteConfirm = (task: Task) => {
    setDeletingTask(task);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    setIsDeleting(true);
    setErrorMessage(null);
    setSyncStatusText('Deleting task from GitHub...');

    try {
      await taskService.deleteTask(deletingTask.id, selectedDate);
      setTasks((prev) => prev.filter((t) => t.id !== deletingTask.id));
      setSuccessMessage(`Deleted task "${deletingTask.task}" and committed to GitHub.`);
      setDeletingTask(null);
      fetchAvailableDates();
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to delete task from GitHub.');
    } finally {
      setIsDeleting(false);
      setSyncStatusText(null);
    }
  };


  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col">
      {/* Top Navbar */}
      <Header
        health={health}
        isLoading={isLoadingTasks}
        isSaving={isSaving || isDeleting}
        onRefresh={() => loadTasksForDate(selectedDate)}
        onOpenConfig={() => setIsConfigOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Status & Sync Banner */}
        {syncStatusText && (
          <div className="bg-[#1f6feb]/15 border border-[#1f6feb]/40 text-[#58a6ff] text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center justify-between animate-pulse">
            <span>{syncStatusText}</span>
            <span className="text-[11px] opacity-75">Committing to GitHub</span>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <StatusBanner
            message={errorMessage}
            type="error"
            onDismiss={() => setErrorMessage(null)}
          />
        )}

        {/* Success Notification */}
        {successMessage && (
          <StatusBanner
            message={successMessage}
            type="success"
            onDismiss={() => setSuccessMessage(null)}
          />
        )}

        {/* Daily Contribution Activity Heatmap Tracker */}
        <div className="w-full">
          <ContributionGraph
            selectedDate={selectedDate}
            activity={activity}
            onSelectDate={handleDateChange}
          />
        </div>

        {/* Date Selector & Stepper */}
        <DateSelector
          selectedDate={selectedDate}
          availableDates={availableDates}
          onChangeDate={handleDateChange}
          disabled={isLoadingTasks || isSaving || isDeleting}
        />

        {/* Daily Notepad & Notes List */}
        <TaskList
          tasks={tasks}
          date={selectedDate}
          isLoading={isLoadingTasks}
          isSaving={isSaving || isDeleting}
          onAddTask={handleOpenAddForm}
          onQuickAdd={handleQuickAdd}
          onEditTask={handleOpenEditForm}
          onDeleteTask={handleOpenDeleteConfirm}
        />
      </main>

      {/* Add / Edit Task Modal */}
      <TaskForm
        isOpen={isFormOpen}
        isEditing={Boolean(editingTask)}
        initialTask={editingTask}
        targetDate={selectedDate}
        isSaving={isSaving}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingTask)}
        task={deletingTask}
        targetDate={selectedDate}
        isDeleting={isDeleting}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Settings / Configuration Modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        health={health}
        onClose={() => setIsConfigOpen(false)}
        onRefreshHealth={fetchHealth}
      />

      {/* Footer */}
      <footer className="border-t border-[#21262d] py-6 text-center text-xs text-[#8b949e]">
        Daily Task Tracker &bull; GitHub Contents API Backend &bull; Tasks stored in <code className="text-[#58a6ff]">{health?.tasksPath || 'tasks'}/YYYY-MM-DD.json</code>
      </footer>
    </div>
  );
};

export default App;
