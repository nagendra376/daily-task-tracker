export type TaskStatus = 'completed' | 'in-progress' | 'pending';

export interface Task {
  id: string;
  task: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DailyTasksFile {
  date: string;
  tasks: Task[];
}

export interface GetTasksResponse {
  date: string;
  tasks: Task[];
  sha: string | null;
  exists: boolean;
}

export interface SearchResultItem {
  date: string;
  task: Task;
  matchedFields: ('title' | 'description' | 'date')[];
}

export interface SearchResponse {
  query: string;
  totalResults: number;
  results: SearchResultItem[];
}

export interface RepoHealth {
  configured: boolean;
  connected: boolean;
  owner: string;
  repo: string;
  branch: string;
  tasksPath: string;
  error?: string | null;
  permissions?: {
    push?: boolean;
    pull?: boolean;
  };
}

export interface CreateTaskPayload {
  date: string;
  task: string;
  description: string;
  status?: TaskStatus;
}

export interface UpdateTaskPayload {
  date: string;
  task?: string;
  description?: string;
  status?: TaskStatus;
}
