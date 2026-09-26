import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes';
import { notesRouter, presenceRouter } from './routes/notes.routes';
import { categoriesRouter } from './routes/categories.routes';
import { tagsRouter } from './routes/tags.routes';
import { exportRouter } from './routes/export.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Global Middleware ───
const corsOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '10mb' }));

// ─── Routes ───
app.use('/auth', authRouter);
app.use('/notes', notesRouter);
app.use('/categories', categoriesRouter);
app.use('/tags', tagsRouter);
app.use(exportRouter);       // Handles /notes/:id/export (full path defined in router)
app.use(presenceRouter);     // Handles /presence/:id (full path defined in router)

// ─── Health Check ───
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Global Error Handler ───
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ───
app.listen(PORT, () => {
  console.log(`[v-noted] Server running on port ${PORT}`);
});

export default app;
