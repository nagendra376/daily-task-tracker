import { Router, Request, Response, NextFunction } from 'express';
import { githubService, GitHubApiError } from '../services/githubService.js';
import { sanitizeError } from '../config.js';

export const apiRouter = Router();

/**
 * Middleware to handle async errors cleanly without leaking tokens
 */
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((err) => {
      const statusCode = err instanceof GitHubApiError ? err.statusCode : 500;
      const message = sanitizeError(err.message || 'An unexpected error occurred.');
      res.status(statusCode).json({
        error: message,
        statusCode,
      });
    });
  };
}

/**
 * GET /api/health
 * Checks GitHub connection and configuration status
 */
apiRouter.get(
  '/health',
  asyncHandler(async (_req: Request, res: Response) => {
    const status = await githubService.verifyConnection();
    res.json(status);
  })
);

/**
 * GET /api/dates
 * Lists all dates that have recorded task files
 */
apiRouter.get(
  '/dates',
  asyncHandler(async (_req: Request, res: Response) => {
    const dates = await githubService.getAvailableDates();
    res.json({ dates });
  })
);

/**
 * GET /api/search?q=query
 * Searches across all task files by title, description, or date
 */
apiRouter.get(
  '/search',
  asyncHandler(async (req: Request, res: Response) => {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const results = await githubService.searchTasks(query);
    res.json(results);
  })
);

/**
 * GET /api/tasks?date=YYYY-MM-DD
 * Retrieves tasks for a given date
 */
apiRouter.get(
  '/tasks',
  asyncHandler(async (req: Request, res: Response) => {
    const date = typeof req.query.date === 'string' ? req.query.date.trim() : '';
    if (!date) {
      res.status(400).json({ error: 'Query parameter "date" is required (format: YYYY-MM-DD).' });
      return;
    }

    const data = await githubService.getTasksForDate(date);
    res.json(data);
  })
);

/**
 * POST /api/tasks
 * Adds a new task for a date and commits to GitHub
 */
apiRouter.post(
  '/tasks',
  asyncHandler(async (req: Request, res: Response) => {
    const { date, task, description, status } = req.body;

    if (!date || typeof date !== 'string') {
      res.status(400).json({ error: 'Field "date" is required (format: YYYY-MM-DD).' });
      return;
    }
    if (!task || typeof task !== 'string' || !task.trim()) {
      res.status(400).json({ error: 'Field "task" (title) is required.' });
      return;
    }

    const result = await githubService.addTask(date.trim(), task.trim(), description || '', status || 'pending');
    res.status(201).json(result);
  })
);

/**
 * PUT /api/tasks/:id
 * Updates an existing task and commits to GitHub
 */
apiRouter.put(
  '/tasks/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { date, task, description, status } = req.body;

    if (!date || typeof date !== 'string') {
      res.status(400).json({ error: 'Field "date" is required.' });
      return;
    }

    const result = await githubService.updateTask(date.trim(), id, {
      task,
      description,
      status,
    });

    res.json(result);
  })
);

/**
 * PATCH /api/tasks/:id/status
 * Updates only the status of a task (e.g. mark completed)
 */
apiRouter.patch(
  '/tasks/:id/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { date, status } = req.body;

    if (!date || typeof date !== 'string') {
      res.status(400).json({ error: 'Field "date" is required.' });
      return;
    }
    if (!status || !['completed', 'in-progress', 'pending'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be "completed", "in-progress", or "pending".' });
      return;
    }

    const result = await githubService.updateTask(date.trim(), id, { status });
    res.json(result);
  })
);

/**
 * DELETE /api/tasks/:id
 * Deletes a task from a date file and commits to GitHub
 */
apiRouter.delete(
  '/tasks/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const date = typeof req.query.date === 'string' ? req.query.date : req.body.date;

    if (!date || typeof date !== 'string') {
      res.status(400).json({ error: 'Query or body parameter "date" is required.' });
      return;
    }

    const result = await githubService.deleteTask(date.trim(), id);
    res.json(result);
  })
);
