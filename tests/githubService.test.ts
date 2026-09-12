import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitHubService, GitHubApiError } from '../server/services/githubService.js';
import { sanitizeError } from '../server/config.js';

describe('GitHubService Unit Tests', () => {
  let service: GitHubService;

  beforeEach(() => {
    // Setup test environment variables
    process.env.GITHUB_TOKEN = 'test_token_secret_12345';
    process.env.GITHUB_OWNER = 'testowner';
    process.env.GITHUB_REPO = 'testrepo';
    process.env.GITHUB_BRANCH = 'main';
    process.env.TASKS_PATH = 'tasks';

    service = new GitHubService();
    vi.restoreAllMocks();
  });

  it('sanitizes tokens from error messages', () => {
    const rawError = 'Failed to fetch https://api.github.com with token test_token_secret_12345: Bad credentials';
    const sanitized = sanitizeError(rawError);
    expect(sanitized).not.toContain('test_token_secret_12345');
    expect(sanitized).toContain('[REDACTED_GITHUB_TOKEN]');
  });

  it('fetches and parses existing tasks for a date', async () => {
    const mockTasks = [
      {
        id: '001',
        task: 'Worked on SSO POC',
        description: 'Tested Microsoft authentication flow',
        status: 'completed',
        createdAt: '2026-09-12T10:00:00Z',
        updatedAt: '2026-09-12T10:00:00Z',
      },
    ];

    const fileContent = JSON.stringify({ date: '2026-09-12', tasks: mockTasks });
    const base64Content = Buffer.from(fileContent).toString('base64');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        sha: 'sha_12345',
        content: base64Content,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await service.getTasksForDate('2026-09-12');
    expect(result.exists).toBe(true);
    expect(result.sha).toBe('sha_12345');
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].task).toBe('Worked on SSO POC');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/contents/tasks/2026-09-12.json?ref=main'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test_token_secret_12345',
        }),
      })
    );
  });

  it('handles 404 gracefully when a date file does not exist yet', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ message: 'Not Found' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await service.getTasksForDate('2026-09-15');
    expect(result.exists).toBe(false);
    expect(result.sha).toBeNull();
    expect(result.tasks).toEqual([]);
  });

  it('creates commit with proper format when adding a task', async () => {
    // 1st call for getTasksForDate returns 404 (file doesn't exist yet)
    // 2nd call for PUT creates the file
    let callCount = 0;
    const fetchMock = vi.fn().mockImplementation(async (url: string, opts: any) => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => ({ message: 'Not Found' }),
        };
      }
      // PUT response
      const reqBody = JSON.parse(opts.body);
      expect(reqBody.message).toBe('Add task: Build task tracker');
      expect(reqBody.branch).toBe('main');
      expect(reqBody.content).toBeDefined();

      // Decode content and verify
      const decodedJson = JSON.parse(Buffer.from(reqBody.content, 'base64').toString('utf-8'));
      expect(decodedJson.date).toBe('2026-09-12');
      expect(decodedJson.tasks).toHaveLength(1);
      expect(decodedJson.tasks[0].task).toBe('Build task tracker');

      return {
        ok: true,
        status: 201,
        json: async () => ({
          content: { sha: 'new_sha_999' },
          commit: { sha: 'commit_sha_888' },
        }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await service.addTask('2026-09-12', 'Build task tracker', 'Create GitHub API integration', 'completed');
    expect(result.task.task).toBe('Build task tracker');
    expect(result.task.status).toBe('completed');
    expect(result.sha).toBe('new_sha_999');
  });

  it('updates an existing task with correct commit message and SHA', async () => {
    const existingTasks = [
      {
        id: 'task_1',
        task: 'Old Title',
        description: 'Old desc',
        status: 'pending' as const,
        createdAt: '2026-09-12T10:00:00Z',
        updatedAt: '2026-09-12T10:00:00Z',
      },
    ];

    let callCount = 0;
    const fetchMock = vi.fn().mockImplementation(async (_url: string, opts: any) => {
      callCount++;
      if (callCount === 1) {
        // GET existing file
        const content = Buffer.from(JSON.stringify({ date: '2026-09-12', tasks: existingTasks })).toString('base64');
        return {
          ok: true,
          status: 200,
          json: async () => ({ sha: 'old_sha_111', content }),
        };
      }
      // PUT updated file
      const body = JSON.parse(opts.body);
      expect(body.message).toBe('Update task: New Title');
      expect(body.sha).toBe('old_sha_111');

      const updatedData = JSON.parse(Buffer.from(body.content, 'base64').toString('utf-8'));
      expect(updatedData.tasks[0].task).toBe('New Title');
      expect(updatedData.tasks[0].status).toBe('completed');

      return {
        ok: true,
        status: 200,
        json: async () => ({ content: { sha: 'updated_sha_222' } }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await service.updateTask('2026-09-12', 'task_1', {
      task: 'New Title',
      status: 'completed',
    });

    expect(result.task.task).toBe('New Title');
    expect(result.task.status).toBe('completed');
    expect(result.sha).toBe('updated_sha_222');
  });

  it('deletes a task with correct commit message', async () => {
    const existingTasks = [
      {
        id: 'task_1',
        task: 'Delete Me',
        description: '',
        status: 'pending' as const,
        createdAt: '2026-09-12T10:00:00Z',
        updatedAt: '2026-09-12T10:00:00Z',
      },
      {
        id: 'task_2',
        task: 'Keep Me',
        description: '',
        status: 'completed' as const,
        createdAt: '2026-09-12T10:00:00Z',
        updatedAt: '2026-09-12T10:00:00Z',
      },
    ];

    let callCount = 0;
    const fetchMock = vi.fn().mockImplementation(async (_url: string, opts: any) => {
      callCount++;
      if (callCount === 1) {
        const content = Buffer.from(JSON.stringify({ date: '2026-09-12', tasks: existingTasks })).toString('base64');
        return {
          ok: true,
          status: 200,
          json: async () => ({ sha: 'sha_before_del', content }),
        };
      }
      const body = JSON.parse(opts.body);
      expect(body.message).toBe('Delete task: Delete Me');
      const updatedData = JSON.parse(Buffer.from(body.content, 'base64').toString('utf-8'));
      expect(updatedData.tasks).toHaveLength(1);
      expect(updatedData.tasks[0].id).toBe('task_2');

      return {
        ok: true,
        status: 200,
        json: async () => ({ content: { sha: 'sha_after_del' } }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await service.deleteTask('2026-09-12', 'task_1');
    expect(result.deletedTaskId).toBe('task_1');
    expect(result.remainingCount).toBe(1);
    expect(result.sha).toBe('sha_after_del');
  });
});
