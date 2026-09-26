import { db } from '../db';
import { tags } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export class TagsService {
  static formatTag(row: typeof tags.$inferSelect) {
    return {
      name: row.name,
      created_at: row.createdAt?.toISOString() ?? '',
    };
  }

  static async getTags(userId: string) {
    const rows = await db.select().from(tags).where(eq(tags.userId, userId));
    // Deduplicate by name to prevent duplicate tag entries
    const seen = new Map<string, typeof rows[0]>();
    for (const row of rows) {
      if (!seen.has(row.name)) seen.set(row.name, row);
    }
    return Array.from(seen.values()).map(this.formatTag);
  }

  static async createTag(userId: string, name: string) {
    const normalized = name.trim().toLowerCase().replace(/\s+/g, '-');

    const [created] = await db.insert(tags)
      .values({ userId, name: normalized })
      .onConflictDoNothing()
      .returning();

    if (!created) {
      const [existing] = await db.select().from(tags)
        .where(and(eq(tags.userId, userId), eq(tags.name, normalized)))
        .limit(1);
      return this.formatTag(existing);
    }
    return this.formatTag(created);
  }

  static async deleteTag(userId: string, tagName: string) {
    await db.delete(tags).where(and(eq(tags.userId, userId), eq(tags.name, tagName)));
    return true;
  }
}
