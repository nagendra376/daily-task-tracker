import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getConfig, sanitizeError } from './config.js';
import { apiRouter } from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const config = getConfig();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes - mount at both /api and root to handle Vercel rewrites seamlessly
app.use('/api', apiRouter);
app.use(apiRouter);

// Serve static assets in production if built
const clientDistPath = path.resolve(__dirname, '../dist');
app.use(express.static(clientDistPath));

// SPA fallback
app.get('*', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'Endpoint not found' });
    return;
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      // In development, client is served by Vite directly
      res.status(200).send(`
        <html>
          <body style="font-family: sans-serif; background: #0d1117; color: #c9d1d9; padding: 40px; text-align: center;">
            <h2>Daily Task Tracker Server Running</h2>
            <p>API is available at <code>/api</code>.</p>
            <p>For development UI, run <code>npm run dev</code> and open <a href="http://localhost:3000" style="color: #58a6ff;">http://localhost:3000</a>.</p>
          </body>
        </html>
      `);
    }
  });
});

// Global error handler - guarantees no tokens leak
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = sanitizeError(err.message || 'Internal Server Error');
  console.error(`[Server Error] Status ${statusCode}: ${message}`);
  res.status(statusCode).json({
    error: message,
    statusCode,
  });
});

// Start listening if executed directly
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`=================================================`);
    console.log(` Daily Task Tracker API Server`);
    console.log(` Server running on: http://localhost:${config.port}`);
    console.log(` GitHub Configured: ${config.isConfigured ? 'YES' : 'NO (check .env)'}`);
    if (config.isConfigured) {
      console.log(` Repository: ${config.githubOwner}/${config.githubRepo} [${config.githubBranch}]`);
      console.log(` Tasks Path: ${config.tasksPath}/`);
    }
    console.log(`=================================================`);
  });
}

export default app;
