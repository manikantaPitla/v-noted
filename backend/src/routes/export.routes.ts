import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { ExportController } from '../controllers/export.controller';

export const exportRouter = Router();

/**
 * @swagger
 * /notes/{id}/export:
 *   get:
 *     summary: Export a note to PDF, Word, or TXT format
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pdf, word, txt]
 *         description: Export format
 *     responses:
 *       200:
 *         description: Successfully generated document
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 base64:
 *                   type: string
 *                 fileName:
 *                   type: string
 *                 contentType:
 *                   type: string
 *       400:
 *         description: Invalid format or missing note ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to export note
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exportRouter.get('/notes/:id/export', requireAuth, ExportController.exportNote);
