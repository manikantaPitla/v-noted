import { Router } from 'express';
import { db } from '../db';
import { tags } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.middleware';

export const tagsRouter = Router();

function formatTag(row: typeof tags.$inferSelect) {
  return {
    name: row.name,
    created_at: row.createdAt?.toISOString() ?? '',
  };
}

// GET /tags
tagsRouter.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await db.select().from(tags)
      .where(eq(tags.userId, req.userId!));

    // Deduplicate by name to prevent duplicate tag entries being saved on the note
    const seen = new Map<string, typeof rows[0]>();
    for (const row of rows) {
      if (!seen.has(row.name)) seen.set(row.name, row);
    }

    return res.json(Array.from(seen.values()).map(formatTag));
  } catch (err) {
    console.error('[tags/get]', err);
    return res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// POST /tags
tagsRouter.post('/', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Tag name is required' });

    const normalized = name.trim().toLowerCase().replace(/\s+/g, '-');

    const [created] = await db.insert(tags)
      .values({ userId: req.userId!, name: normalized })
      .onConflictDoNothing()
      .returning();

    // If conflict (tag already exists), fetch and return the existing one
    if (!created) {
      const [existing] = await db.select().from(tags)
        .where(and(eq(tags.userId, req.userId!), eq(tags.name, normalized)))
        .limit(1);
      return res.status(201).json(formatTag(existing));
    }

    return res.status(201).json(formatTag(created));
  } catch (err) {
    console.error('[tags/create]', err);
    return res.status(500).json({ error: 'Failed to create tag' });
  }
});

// DELETE /tags/:name
tagsRouter.delete('/:name', requireAuth, async (req, res) => {
  try {
    const tagName = req.params.name;
    if (!tagName) return res.status(400).json({ error: 'Invalid tag name' });

    // Delete cascades to note_tags entries automatically
    await db.delete(tags)
      .where(and(eq(tags.userId, req.userId!), eq(tags.name, tagName)));

    return res.json({ success: true });
  } catch (err) {
    console.error('[tags/delete]', err);
    return res.status(500).json({ error: 'Failed to delete tag' });
  }
});
