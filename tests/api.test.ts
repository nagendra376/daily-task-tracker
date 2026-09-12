import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../server/index.js';

describe('Express API Endpoints', () => {
  beforeEach(() => {
    process.env.GITHUB_TOKEN = 'test_token_val';
    process.env.GITHUB_OWNER = 'sampleowner';
    process.env.GITHUB_REPO = 'samplerepo';
    process.env.GITHUB_BRANCH = 'main';
    process.env.TASKS_PATH = 'tasks';
  });

  it('GET /api/tasks returns 400 when date parameter is missing', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Query parameter "date" is required');
  });

  it('POST /api/tasks returns 400 when task title is empty', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ date: '2026-09-12', task: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Field "task" (title) is required');
  });

  it('PATCH /api/tasks/:id/status returns 400 on invalid status', async () => {
    const res = await request(app)
      .patch('/api/tasks/123/status')
      .send({ date: '2026-09-12', status: 'invalid-status' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid status');
  });

  it('GET /api/health returns configured repo metadata', async () => {
    // Mock fetch for verifyConnection call
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        name: 'samplerepo',
        permissions: { push: true, pull: true },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.configured).toBe(true);
    expect(res.body.owner).toBe('sampleowner');
    expect(res.body.repo).toBe('samplerepo');
  });
});
