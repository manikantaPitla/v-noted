import { Router } from 'express';
import { db } from '../db';
import { categories } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.middleware';

export const categoriesRouter = Router();

function formatCategory(row: typeof categories.$inferSelect) {
  return {
    id: row.id,
    user_id: row.userId,
    name: row.name,
    color: row.color,
    created_at: row.createdAt?.toISOString() ?? '',
    updated_at: row.updatedAt?.toISOString() ?? null,
  };
}

// GET /categories
categoriesRouter.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await db.select().from(categories)
      .where(eq(categories.userId, req.userId!));
    return res.json(rows.map(formatCategory));
  } catch (err) {
    console.error('[categories/get]', err);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /categories
categoriesRouter.post('/', requireAuth, async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Category name is required' });

    const [created] = await db.insert(categories)
      .values({
        userId: req.userId!,
        name: name.trim(),
        color: color || '#818CF8',
      })
      .returning();

    return res.status(201).json(formatCategory(created));
  } catch (err) {
    console.error('[categories/create]', err);
    return res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /categories/:id
categoriesRouter.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const dto = req.body;

    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.name !== undefined) updateFields.name = dto.name;
    if (dto.color !== undefined) updateFields.color = dto.color;

    const [updated] = await db.update(categories)
      .set(updateFields)
      .where(and(eq(categories.id, id), eq(categories.userId, req.userId!)))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Category not found' });
    return res.json(formatCategory(updated));
  } catch (err) {
    console.error('[categories/update]', err);
    return res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /categories/:id
categoriesRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, req.userId!)))
      .returning();

    if (result.length === 0) return res.status(404).json({ error: 'Category not found' });
    return res.json({ success: true });
  } catch (err) {
    console.error('[categories/delete]', err);
    return res.status(500).json({ error: 'Failed to delete category' });
  }
});
