import 'dotenv/config';
import 'express-async-errors'; // Must be first after env setup to patch Express
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes';
import { notesRouter, presenceRouter } from './routes/notes.routes';
import { categoriesRouter } from './routes/categories.routes';
import { tagsRouter } from './routes/tags.routes';
import { exportRouter } from './routes/export.routes';
import { setupSwagger } from './swagger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Global Middleware ───
const corsOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '10mb' }));

// ─── API Docs ───
setupSwagger(app);

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

// ─── Fallback & Error Handling ───
// Catch 404s
app.use(notFoundHandler);
// Catch all thrown errors (centralized error middleware)
app.use(errorHandler);

// ─── Start ───
app.listen(PORT, () => {
  console.log(`[v-noted] Server running on port ${PORT}`);
});

// Prevent Node process from crashing on unhandled promise rejections or exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('[process] Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('[process] Uncaught Exception:', error);
  // Optional: In production you might want to process.exit(1) here and let Render restart it, 
  // but to strictly prevent crashes, we log it and keep running.
});

export default app;
