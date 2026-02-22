import express from 'express';

import { createServer as createViteServer } from 'vite';

import projectsRouter from './src/routes/projects';
import videosRouter from './src/routes/videos';
import tiersRouter from './src/routes/tiers';
import purchasesRouter from './src/routes/purchases';
import { protect } from './src/middleware/auth';

import path from 'path';
import { fileURLToPath } from 'url';

async function startServer() {
  const app = express();
  app.use(express.json()); // Middleware to parse JSON bodies

  
  const PORT = process.env.PORT || 3000;

  

  // API routes
  
  app.use('/api/projects', protect, projectsRouter);
  app.use('/api/videos', protect, videosRouter);
  // Stripe webhook needs to be before the default JSON parser
app.use('/api/purchases', purchasesRouter);
app.use('/api/tiers', protect, tiersRouter);
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV === 'production') {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    app.use(express.static(path.join(__dirname, 'dist')));

    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
