import { Request, Response, NextFunction } from 'express';

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  res.status(404).json({ error: 'Endpoint not found' });
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[Error]', err);

  const statusCode = err.status || err.statusCode || 500;
  
  // In production, mask detailed 500 server errors to prevent leaking sensitive internals
  const message = (process.env.NODE_ENV === 'production' && statusCode === 500)
    ? 'Internal server error'
    : err.message || 'Internal server error';

  res.status(statusCode).json({ error: message });
}
