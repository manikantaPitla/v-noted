import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  static async googleLogin(req: Request, res: Response) {
    try {
      const { credential } = req.body;
      if (!credential) return res.status(400).json({ error: 'Missing credential' });

      const result = await AuthService.googleLogin(credential);
      return res.json(result);
    } catch (err) {
      console.error('[auth/google]', err);
      return res.status(401).json({ error: 'Authentication failed' });
    }
  }

  static async updateProfile(req: Request, res: Response) {
    try {
      const updated = await AuthService.updateProfile(req.userId!, req.body);
      if (!updated) return res.status(404).json({ error: 'Profile not found' });

      return res.json(updated);
    } catch (err) {
      console.error('[auth/profile]', err);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  static async resetAccount(req: Request, res: Response) {
    try {
      await AuthService.resetAccount(req.userId!, req.userEmail!, req.userName!);
      return res.json({ success: true, message: 'Account reset and re-seeded' });
    } catch (err) {
      console.error('[auth/reset]', err);
      return res.status(500).json({ error: 'Failed to reset account' });
    }
  }
}
