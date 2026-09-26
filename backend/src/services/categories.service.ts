import { db } from '../db';
import { categories } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export class CategoriesService {
  static formatCategory(row: typeof categories.$inferSelect) {
    return {
      id: row.id,
      user_id: row.userId,
      name: row.name,
      color: row.color,
      created_at: row.createdAt?.toISOString() ?? '',
      updated_at: row.updatedAt?.toISOString() ?? null,
    };
  }

  static async getCategories(userId: string) {
    const rows = await db.select().from(categories).where(eq(categories.userId, userId));
    return rows.map(this.formatCategory);
  }

  static async createCategory(userId: string, name: string, color?: string) {
    const [created] = await db.insert(categories)
      .values({
        userId,
        name: name.trim(),
        color: color || '#818CF8',
      })
      .returning();
    return this.formatCategory(created);
  }

  static async updateCategory(userId: string, categoryId: string, data: { name?: string; color?: string }) {
    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.color !== undefined) updateFields.color = data.color;

    const [updated] = await db.update(categories)
      .set(updateFields)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .returning();

    return updated ? this.formatCategory(updated) : null;
  }

  static async deleteCategory(userId: string, categoryId: string) {
    const result = await db.delete(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .returning();
    return result.length > 0;
  }
}
