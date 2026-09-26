import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../lib/auth';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      userName?: string;
    }
  }
}

/**
 * Express middleware that verifies the JWT from the Authorization header
 * and attaches decoded user info to the request object.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = header.slice(7);
    const decoded = verifyJwt(token);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userName = decoded.name;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Attempts to extract and verify a JWT without rejecting if absent.
 * Used for endpoints that behave differently for authenticated vs anonymous users.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const decoded = verifyJwt(header.slice(7));
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
      req.userName = decoded.name;
    } catch {
      // Token invalid — proceed as unauthenticated
    }
  }
  next();
}
