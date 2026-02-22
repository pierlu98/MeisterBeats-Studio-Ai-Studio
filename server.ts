import express from 'express';
import session from 'express-session';
import { createServer as createViteServer } from 'vite';
import authRouter from './src/routes/auth';
import projectsRouter from './src/routes/projects';
import { initializeDatabase } from './src/services/db';

async function startServer() {
  const app = express();
  app.use(express.json()); // Middleware to parse JSON bodies

  initializeDatabase();
  const PORT = 3000;

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'a_very_secret_key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
      },
    })
  );

  // API routes
  app.use('/api/auth', authRouter);
  app.use('/api/projects', projectsRouter);
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
