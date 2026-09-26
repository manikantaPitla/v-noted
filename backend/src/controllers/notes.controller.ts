import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { NotesService } from '../services/notes.service';

export class NotesController {
  
  static async getSharedNote(req: Request, res: Response, next: NextFunction) {
    const { u: ownerUserId } = req.query as { u?: string };
    
    // If no ?u= param, pass to regular authenticated GET handler
    if (!ownerUserId) return next();

    try {
      const note = await NotesService.getSharedNote(req.params.id, ownerUserId);
      if (!note) return res.status(404).json({ error: 'Note not found or not public' });
      return res.json(note);
    } catch (err) {
      console.error('[notes/shared]', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updatePresence(req: Request, res: Response) {
    try {
      const ownerUserId = req.query.u as string;
      if (!ownerUserId) return res.status(400).json({ error: 'Missing owner user ID' });

      let viewer = req.body as { viewer_id?: string; name?: string; email?: string; avatar?: string };

      if (req.userId) {
        const [viewerProfile] = await db.select().from(users).where(eq(users.id, req.userId)).limit(1);
        viewer = {
          viewer_id: req.userId,
          name: String(viewerProfile?.name || req.userName || 'Viewer'),
          email: String(viewerProfile?.email || req.userEmail || ''),
          avatar: viewerProfile?.avatar || undefined,
        };
      }

      if (!viewer.viewer_id?.trim()) return res.status(400).json({ error: 'Missing viewer id' });

      const success = await NotesService.updatePresence(req.params.id, ownerUserId, viewer);
      if (!success) return res.status(404).json({ error: 'Note not available' });

      return res.json({ success: true });
    } catch (err) {
      console.error('[presence]', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getActiveViewers(req: Request, res: Response) {
    try {
      const viewers = await NotesService.getActiveViewers(req.params.id, req.userId!);
      if (!viewers) return res.status(404).json({ error: 'Note not found' });
      
      return res.json(viewers);
    } catch (err) {
      console.error('[notes/viewers]', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async listNotes(req: Request, res: Response) {
    try {
      const notes = await NotesService.listNotes(req.userId!, req.query);
      return res.json(notes);
    } catch (err) {
      console.error('[notes/list]', err);
      return res.status(500).json({ error: 'Failed to fetch notes' });
    }
  }

  static async getNote(req: Request, res: Response) {
    try {
      const noteId = req.params.id;
      if (noteId === 'undefined' || noteId === 'null') return res.status(400).json({ error: 'Invalid ID' });

      const note = await NotesService.getNote(noteId, req.userId!);
      if (!note) return res.status(404).json({ error: 'Note not found' });
      
      return res.json(note);
    } catch (err) {
      console.error('[notes/get]', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createNote(req: Request, res: Response) {
    try {
      const note = await NotesService.createNote(req.userId!, req.body);
      return res.status(201).json(note);
    } catch (err) {
      console.error('[notes/create]', err);
      return res.status(500).json({ error: 'Failed to create note' });
    }
  }

  static async updateNote(req: Request, res: Response) {
    try {
      const noteId = req.params.id;
      if (noteId === 'undefined' || noteId === 'null') return res.status(400).json({ error: 'Invalid ID' });

      const updated = await NotesService.updateNote(noteId, req.userId!, req.body);
      if (!updated) return res.status(404).json({ error: 'Note not found' });
      
      return res.json(updated);
    } catch (err) {
      console.error('[notes/update]', err);
      return res.status(500).json({ error: 'Failed to update note' });
    }
  }

  static async deleteNote(req: Request, res: Response) {
    try {
      const noteId = req.params.id;
      if (noteId === 'undefined' || noteId === 'null') return res.status(400).json({ error: 'Invalid ID' });

      const success = await NotesService.deleteNote(noteId, req.userId!);
      if (!success) return res.status(404).json({ error: 'Note not found' });
      
      return res.json({ success: true });
    } catch (err) {
      console.error('[notes/delete]', err);
      return res.status(500).json({ error: 'Failed to delete note' });
    }
  }
}
