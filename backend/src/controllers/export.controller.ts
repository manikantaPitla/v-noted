import { Request, Response } from 'express';
import { db } from '../db';
import { notes } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { ExportService, ExportNote } from '../services/export.service';

const exportService = new ExportService();

export class ExportController {
  static async exportNote(req: Request, res: Response) {
    try {
      const noteId = req.params.id;
      const format = (req.query.format as string)?.toLowerCase();

      if (!noteId) return res.status(400).json({ error: 'Note ID is required' });
      if (!format || !['pdf', 'word', 'txt'].includes(format)) {
        return res.status(400).json({ error: 'Invalid format. Supported: pdf, word, txt' });
      }

      const [note] = await db.select().from(notes)
        .where(and(eq(notes.id, noteId), eq(notes.userId, req.userId!)))
        .limit(1);

      if (!note) return res.status(404).json({ error: 'Note not found' });

      // Map DB row to the ExportService's expected shape
      const exportNote: ExportNote = {
        id: note.id,
        user_id: note.userId,
        title: note.title || '',
        content_json: note.contentJson,
        content_text: note.contentText || '',
        category: note.categoryId ?? undefined,
        is_public: note.isPublic ?? false,
        created_at: note.createdAt?.toISOString() ?? '',
        updated_at: note.updatedAt?.toISOString() ?? '',
      };

      let buffer: Buffer;
      let contentType: string;
      let extension: string;

      switch (format) {
        case 'pdf':
          buffer = await exportService.generatePdf(exportNote);
          contentType = 'application/pdf';
          extension = 'pdf';
          break;
        case 'word':
          buffer = await exportService.generateWord(exportNote);
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          extension = 'docx';
          break;
        case 'txt':
          buffer = await exportService.generateTxt(exportNote);
          contentType = 'text/plain';
          extension = 'txt';
          break;
        default:
          return res.status(400).json({ error: 'Unsupported format' });
      }

      const fileName = `${(note.title || 'note').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;

      return res.json({
        base64: buffer.toString('base64'),
        fileName,
        contentType,
      });
    } catch (err: any) {
      console.error('[export]', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
