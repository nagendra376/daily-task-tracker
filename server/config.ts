import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export interface ServerConfig {
  port: number;
  githubToken: string;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  tasksPath: string;
  isConfigured: boolean;
}

export function getConfig(): ServerConfig {
  const token = (process.env.GITHUB_TOKEN || '').trim();
  const owner = (process.env.GITHUB_OWNER || '').trim();
  const repo = (process.env.GITHUB_REPO || '').trim();
  const branch = (process.env.GITHUB_BRANCH || 'main').trim();
  const tasksPath = (process.env.TASKS_PATH || 'tasks').trim().replace(/^\/+|\/+$/g, '');
  const port = parseInt(process.env.PORT || '3001', 10);

  const isConfigured = Boolean(
    token &&
    owner &&
    repo &&
    token !== 'your_github_personal_access_token_here' &&
    owner !== 'your_github_username'
  );

  return {
    port: isNaN(port) ? 3001 : port,
    githubToken: token,
    githubOwner: owner,
    githubRepo: repo,
    githubBranch: branch,
    tasksPath,
    isConfigured,
  };
}

/**
 * Strips sensitive tokens and credentials from any error message or string.
 */
export function sanitizeError(error: any): string {
  if (!error) return 'An unknown error occurred';
  let message = typeof error === 'string' ? error : error.message || String(error);
  
  const token = process.env.GITHUB_TOKEN;
  if (token && token.length > 5) {
    message = message.split(token).join('[REDACTED_GITHUB_TOKEN]');
  }

  // Also sanitize authorization headers or bearer patterns if present
  message = message.replace(/(?:bearer|token)\s+[a-zA-Z0-9_\-]+/gi, '[REDACTED_CREDENTIAL]');

  return message;
}
