import type {
  GetTasksResponse,
  Task,
  TaskStatus,
  SearchResponse,
  RepoHealth,
  CreateTaskPayload,
  UpdateTaskPayload,
} from '../types/task';

class TaskService {
  private baseUrl = '/api';

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      let message = 'An error occurred while communicating with the server.';
      try {
        const errorData = await res.json();
        message = errorData.error || message;
      } catch {
        message = await res.text();
      }
      throw new Error(message || `Request failed with status ${res.status}`);
    }

    return res.json();
  }

  /**
   * Retrieves tasks for a given date (YYYY-MM-DD)
   */
  async getTasks(date: string): Promise<GetTasksResponse> {
    return this.request<GetTasksResponse>(`/tasks?date=${encodeURIComponent(date)}`);
  }

  /**
   * Adds a new task to a given date
   */
  async addTask(payload: CreateTaskPayload): Promise<{ task: Task; sha: string }> {
    return this.request<{ task: Task; sha: string }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Updates an existing task
   */
  async updateTask(id: string, payload: UpdateTaskPayload): Promise<{ task: Task; sha: string }> {
    return this.request<{ task: Task; sha: string }>(`/tasks/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Toggles or sets task status
   */
  async toggleTaskStatus(id: string, date: string, status: TaskStatus): Promise<{ task: Task; sha: string }> {
    return this.request<{ task: Task; sha: string }>(`/tasks/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ date, status }),
    });
  }

  /**
   * Deletes a task by ID
   */
  async deleteTask(id: string, date: string): Promise<{ deletedTaskId: string; sha: string; remainingCount: number }> {
    return this.request<{ deletedTaskId: string; sha: string; remainingCount: number }>(
      `/tasks/${encodeURIComponent(id)}?date=${encodeURIComponent(date)}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Retrieves all dates that have recorded task files
   */
  async getAvailableDates(): Promise<string[]> {
    const data = await this.request<{ dates: string[] }>('/dates');
    return data.dates || [];
  }

  /**
   * Searches across all tasks by title, description, or date
   */
  async searchTasks(query: string): Promise<SearchResponse> {
    return this.request<SearchResponse>(`/search?q=${encodeURIComponent(query)}`);
  }

  /**
   * Checks GitHub connection and configuration status
   */
  async checkHealth(): Promise<RepoHealth> {
    return this.request<RepoHealth>('/health');
  }
}

export const taskService = new TaskService();
