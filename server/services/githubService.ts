import { getConfig, sanitizeError } from '../config.js';
import type { Task, DailyTasksFile, GetTasksResponse, SearchResponse, SearchResultItem, RepoHealth } from '../types.js';

interface CacheEntry {
  sha: string;
  tasks: Task[];
  fetchedAt: number;
}

// In-memory cache keyed by date to prevent excessive GitHub API rate-limit consumption
const taskCache: Map<string, CacheEntry> = new Map();

/**
 * Custom error class with HTTP status code
 */
export class GitHubApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'GitHubApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Service to communicate with GitHub Contents API
 */
export class GitHubService {
  private getHeaders(): Record<string, string> {
    const config = getConfig();
    if (!config.githubToken) {
      throw new GitHubApiError('GitHub token is not configured. Please set GITHUB_TOKEN in your environment.', 401);
    }
    return {
      'Authorization': `Bearer ${config.githubToken}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'DailyTaskTracker/1.0',
      'Content-Type': 'application/json',
    };
  }

  private getRepoBaseUrl(): string {
    const config = getConfig();
    if (!config.githubOwner || !config.githubRepo) {
      throw new GitHubApiError('GitHub repository owner or name is not configured.', 400);
    }
    return `https://api.github.com/repos/${encodeURIComponent(config.githubOwner)}/${encodeURIComponent(config.githubRepo)}`;
  }

  private getFilePath(date: string): string {
    const config = getConfig();
    const cleanDate = date.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      throw new GitHubApiError(`Invalid date format: "${cleanDate}". Expected YYYY-MM-DD.`, 400);
    }
    return config.tasksPath ? `${config.tasksPath}/${cleanDate}.json` : `${cleanDate}.json`;
  }

  /**
   * Helper to perform safe fetch to GitHub API with error parsing and token sanitization
   */
  private async fetchGitHub(url: string, options: RequestInit = {}): Promise<Response> {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorJson = await response.json();
          errorDetails = errorJson.message || JSON.stringify(errorJson);
        } catch {
          errorDetails = await response.text();
        }

        if (response.status === 401) {
          throw new GitHubApiError('GitHub authentication failed. Please check your Personal Access Token.', 401);
        }
        if (response.status === 403) {
          if (errorDetails.toLowerCase().includes('rate limit')) {
            throw new GitHubApiError('GitHub API rate limit exceeded. Please wait a few minutes before trying again.', 429);
          }
          throw new GitHubApiError('Access denied by GitHub. Ensure your token has permission to access this repository.', 403);
        }
        if (response.status === 404) {
          throw new GitHubApiError(`Resource not found on GitHub: ${response.statusText}`, 404);
        }
        if (response.status === 409) {
          throw new GitHubApiError('GitHub update conflict: The file was modified concurrently.', 409);
        }

        throw new GitHubApiError(
          sanitizeError(`GitHub API Error (${response.status}): ${errorDetails || response.statusText}`),
          response.status
        );
      }
      return response;
    } catch (err: any) {
      if (err instanceof GitHubApiError) {
        throw err;
      }
      throw new GitHubApiError(
        sanitizeError(`Network error while communicating with GitHub: ${err.message || 'Unknown network error'}`),
        503
      );
    }
  }

  /**
   * Reads task file for a specific date: GET /repos/{owner}/{repo}/contents/{path}/{date}.json
   */
  public async getTasksForDate(date: string): Promise<GetTasksResponse> {
    const config = getConfig();
    const filePath = this.getFilePath(date);
    const url = `${this.getRepoBaseUrl()}/contents/${filePath}?ref=${encodeURIComponent(config.githubBranch)}`;

    try {
      const response = await this.fetchGitHub(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();
      const contentBase64 = data.content ? data.content.replace(/\n/g, '') : '';
      const contentUtf8 = Buffer.from(contentBase64, 'base64').toString('utf-8');

      let parsed: DailyTasksFile;
      try {
        parsed = JSON.parse(contentUtf8);
      } catch (parseErr) {
        throw new GitHubApiError(`Invalid JSON format in GitHub file ${filePath}: ${(parseErr as Error).message}`, 500);
      }

      const tasks: Task[] = Array.isArray(parsed.tasks) ? parsed.tasks : [];

      // Update cache
      taskCache.set(date, {
        sha: data.sha,
        tasks,
        fetchedAt: Date.now(),
      });

      return {
        date,
        tasks,
        sha: data.sha,
        exists: true,
      };
    } catch (error: any) {
      if (error instanceof GitHubApiError && error.statusCode === 404) {
        // File does not exist yet on GitHub for this date
        return {
          date,
          tasks: [],
          sha: null,
          exists: false,
        };
      }
      throw error;
    }
  }

  /**
   * Commits task list to GitHub using PUT /repos/{owner}/{repo}/contents/{path}/{date}.json
   */
  public async saveTasksForDate(
    date: string,
    tasks: Task[],
    commitMessage: string,
    expectedSha?: string | null,
    retryCount: number = 0
  ): Promise<{ sha: string; tasks: Task[] }> {
    const config = getConfig();
    const filePath = this.getFilePath(date);
    const url = `${this.getRepoBaseUrl()}/contents/${filePath}`;

    const fileContent: DailyTasksFile = {
      date,
      tasks,
    };

    const jsonString = JSON.stringify(fileContent, null, 2) + '\n';
    const contentBase64 = Buffer.from(jsonString, 'utf-8').toString('base64');

    const body: Record<string, any> = {
      message: commitMessage,
      content: contentBase64,
      branch: config.githubBranch,
    };

    if (expectedSha) {
      body.sha = expectedSha;
    }

    try {
      const response = await this.fetchGitHub(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      const data = await response.json();
      const newSha = data.content?.sha || data.commit?.sha;

      // Update in-memory cache
      taskCache.set(date, {
        sha: newSha,
        tasks,
        fetchedAt: Date.now(),
      });

      return {
        sha: newSha,
        tasks,
      };
    } catch (error: any) {
      // Automatic conflict handling for concurrent modifications (HTTP 409)
      if (error instanceof GitHubApiError && error.statusCode === 409 && retryCount < 2) {
        // Wait 300ms, fetch latest SHA, and retry
        await new Promise((resolve) => setTimeout(resolve, 300));
        const latest = await this.getTasksForDate(date);
        return this.saveTasksForDate(date, tasks, commitMessage, latest.sha, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Adds a task to a date file and creates a commit
   */
  public async addTask(date: string, taskTitle: string, description: string = '', status: Task['status'] = 'pending'): Promise<{ task: Task; sha: string }> {
    const cleanTitle = taskTitle.trim();
    if (!cleanTitle) {
      throw new GitHubApiError('Task title cannot be empty.', 400);
    }

    const current = await this.getTasksForDate(date);
    const nowIso = new Date().toISOString();

    const newTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      task: cleanTitle,
      description: (description || '').trim(),
      status: status || 'pending',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const updatedTasks = [...current.tasks, newTask];
    const commitMessage = `Add task: ${cleanTitle}`;

    const result = await this.saveTasksForDate(date, updatedTasks, commitMessage, current.sha);

    return {
      task: newTask,
      sha: result.sha,
    };
  }

  /**
   * Updates an existing task and creates a commit
   */
  public async updateTask(
    date: string,
    taskId: string,
    updates: { task?: string; description?: string; status?: Task['status'] }
  ): Promise<{ task: Task; sha: string }> {
    const current = await this.getTasksForDate(date);
    const taskIndex = current.tasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) {
      throw new GitHubApiError(`Task with ID "${taskId}" not found on date ${date}.`, 404);
    }

    const existingTask = current.tasks[taskIndex];
    const updatedTitle = updates.task !== undefined ? updates.task.trim() : existingTask.task;
    if (!updatedTitle) {
      throw new GitHubApiError('Task title cannot be empty.', 400);
    }

    const updatedTask: Task = {
      ...existingTask,
      task: updatedTitle,
      description: updates.description !== undefined ? updates.description.trim() : existingTask.description,
      status: updates.status !== undefined ? updates.status : existingTask.status,
      updatedAt: new Date().toISOString(),
    };

    const updatedTasks = [...current.tasks];
    updatedTasks[taskIndex] = updatedTask;

    const commitMessage = `Update task: ${updatedTitle}`;
    const result = await this.saveTasksForDate(date, updatedTasks, commitMessage, current.sha);

    return {
      task: updatedTask,
      sha: result.sha,
    };
  }

  /**
   * Deletes a task from a date file and creates a commit
   */
  public async deleteTask(date: string, taskId: string): Promise<{ deletedTaskId: string; sha: string; remainingCount: number }> {
    const current = await this.getTasksForDate(date);
    const taskToDelete = current.tasks.find((t) => t.id === taskId);

    if (!taskToDelete) {
      throw new GitHubApiError(`Task with ID "${taskId}" not found on date ${date}.`, 404);
    }

    const updatedTasks = current.tasks.filter((t) => t.id !== taskId);
    const commitMessage = `Delete task: ${taskToDelete.task}`;

    const result = await this.saveTasksForDate(date, updatedTasks, commitMessage, current.sha);

    return {
      deletedTaskId: taskId,
      sha: result.sha,
      remainingCount: updatedTasks.length,
    };
  }

  /**
   * Lists all dates that have recorded task files in GitHub
   */
  public async getAvailableDates(): Promise<string[]> {
    const config = getConfig();
    const url = `${this.getRepoBaseUrl()}/contents/${encodeURIComponent(config.tasksPath)}?ref=${encodeURIComponent(config.githubBranch)}`;

    try {
      const response = await this.fetchGitHub(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const items = await response.json();
      if (!Array.isArray(items)) {
        return [];
      }

      const dates: string[] = [];
      for (const item of items) {
        if (item.type === 'file' && item.name.endsWith('.json')) {
          const match = item.name.match(/^(\d{4}-\d{2}-\d{2})\.json$/);
          if (match) {
            dates.push(match[1]);
          }
        }
      }

      // Sort descending (most recent first)
      return dates.sort((a, b) => b.localeCompare(a));
    } catch (error: any) {
      if (error instanceof GitHubApiError && error.statusCode === 404) {
        // tasks directory does not exist yet
        return [];
      }
      throw error;
    }
  }

  /**
   * Searches across all tasks in all date files
   */
  public async searchTasks(query: string): Promise<SearchResponse> {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) {
      return { query: '', totalResults: 0, results: [] };
    }

    const config = getConfig();
    const dirUrl = `${this.getRepoBaseUrl()}/contents/${encodeURIComponent(config.tasksPath)}?ref=${encodeURIComponent(config.githubBranch)}`;

    let dirItems: any[] = [];
    try {
      const response = await this.fetchGitHub(dirUrl, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      dirItems = await response.json();
    } catch (err: any) {
      if (err instanceof GitHubApiError && err.statusCode === 404) {
        return { query, totalResults: 0, results: [] };
      }
      throw err;
    }

    if (!Array.isArray(dirItems)) {
      return { query, totalResults: 0, results: [] };
    }

    const matchedResults: SearchResultItem[] = [];

    // Filter date files
    const dateFiles = dirItems.filter((item) => item.type === 'file' && /^\d{4}-\d{2}-\d{2}\.json$/.test(item.name));

    for (const fileItem of dateFiles) {
      const date = fileItem.name.replace('.json', '');
      let tasks: Task[] = [];

      // Check cache validity against SHA
      const cached = taskCache.get(date);
      if (cached && cached.sha === fileItem.sha) {
        tasks = cached.tasks;
      } else {
        try {
          const dateData = await this.getTasksForDate(date);
          tasks = dateData.tasks;
        } catch {
          continue;
        }
      }

      // Check date matching
      const dateMatches = date.includes(cleanQuery);

      for (const task of tasks) {
        const titleMatches = task.task.toLowerCase().includes(cleanQuery);
        const descMatches = (task.description || '').toLowerCase().includes(cleanQuery);

        if (titleMatches || descMatches || dateMatches) {
          const matchedFields: ('title' | 'description' | 'date')[] = [];
          if (titleMatches) matchedFields.push('title');
          if (descMatches) matchedFields.push('description');
          if (dateMatches) matchedFields.push('date');

          matchedResults.push({
            date,
            task,
            matchedFields,
          });
        }
      }
    }

    // Sort matching results descending by date, then task title
    matchedResults.sort((a, b) => b.date.localeCompare(a.date));

    return {
      query,
      totalResults: matchedResults.length,
      results: matchedResults,
    };
  }

  /**
   * Verifies connection to GitHub repository and validates permissions
   */
  public async verifyConnection(): Promise<RepoHealth> {
    const config = getConfig();
    if (!config.isConfigured) {
      return {
        configured: false,
        connected: false,
        owner: config.githubOwner || '',
        repo: config.githubRepo || '',
        branch: config.githubBranch || 'main',
        tasksPath: config.tasksPath || 'tasks',
        error: 'GitHub configuration incomplete. GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO is missing.',
      };
    }

    try {
      const repoUrl = this.getRepoBaseUrl();
      const response = await this.fetchGitHub(repoUrl, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const repoData = await response.json();

      return {
        configured: true,
        connected: true,
        owner: config.githubOwner,
        repo: config.githubRepo,
        branch: config.githubBranch,
        tasksPath: config.tasksPath,
        permissions: {
          push: repoData.permissions?.push ?? true,
          pull: repoData.permissions?.pull ?? true,
        },
      };
    } catch (error: any) {
      return {
        configured: true,
        connected: false,
        owner: config.githubOwner,
        repo: config.githubRepo,
        branch: config.githubBranch,
        tasksPath: config.tasksPath,
        error: sanitizeError(error.message || 'Unable to connect to GitHub repository.'),
      };
    }
  }
}

// Export singleton instance
export const githubService = new GitHubService();
