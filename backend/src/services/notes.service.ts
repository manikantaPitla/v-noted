import { db } from '../db';
import { notes, noteTags, tags, users, presence } from '../db/schema';
import { eq, and, desc, ilike, or, inArray, gt, lte, sql } from 'drizzle-orm';

export class NotesService {
  static formatNote(row: typeof notes.$inferSelect, tagNames: string[] = []) {
    return {
      id: row.id,
      user_id: row.userId,
      title: row.title,
      content_json: row.contentJson,
      content_text: row.contentText,
      category: row.categoryId,
      tags: tagNames,
      is_public: row.isPublic,
      is_pinned: row.isPinned,
      created_at: row.createdAt?.toISOString() ?? '',
      updated_at: row.updatedAt?.toISOString() ?? '',
    };
  }

  static async getTagsForNotes(noteIds: string[]): Promise<Map<string, string[]>> {
    const tagMap = new Map<string, string[]>();
    if (noteIds.length === 0) return tagMap;

    const rows = await db.select({
      noteId: noteTags.noteId,
      tagName: tags.name,
    })
      .from(noteTags)
      .innerJoin(tags, eq(noteTags.tagId, tags.id))
      .where(inArray(noteTags.noteId, noteIds));

    for (const row of rows) {
      const existing = tagMap.get(row.noteId) || [];
      existing.push(row.tagName);
      tagMap.set(row.noteId, existing);
    }

    return tagMap;
  }

  static async resolveTagIds(userId: string, tagNames: string[]): Promise<string[]> {
    if (tagNames.length === 0) return [];

    const existing = await db.select({ id: tags.id, name: tags.name })
      .from(tags)
      .where(and(eq(tags.userId, userId), inArray(tags.name, tagNames)));

    const existingByName = new Map(existing.map(t => [t.name, t.id]));
    const missing = tagNames.filter(n => !existingByName.has(n));

    if (missing.length > 0) {
      const created = await db.insert(tags)
        .values(missing.map(name => ({ userId, name })))
        .onConflictDoNothing()
        .returning();

      for (const t of created) {
        existingByName.set(t.name, t.id);
      }

      const stillMissing = missing.filter(n => !existingByName.has(n));
      if (stillMissing.length > 0) {
        const fetched = await db.select({ id: tags.id, name: tags.name })
          .from(tags)
          .where(and(eq(tags.userId, userId), inArray(tags.name, stillMissing)));
        for (const t of fetched) existingByName.set(t.name, t.id);
      }
    }

    return tagNames.map(n => existingByName.get(n)).filter((id): id is string => id !== undefined);
  }

  static async syncNoteTags(noteId: string, userId: string, tagNames: string[]) {
    await db.delete(noteTags).where(eq(noteTags.noteId, noteId));

    if (tagNames.length > 0) {
      const tagIds = await this.resolveTagIds(userId, tagNames);
      if (tagIds.length > 0) {
        await db.insert(noteTags)
          .values(tagIds.map(tagId => ({ noteId, tagId })))
          .onConflictDoNothing();
      }
    }
  }

  static async getSharedNote(noteId: string, ownerUserId: string) {
    const [note] = await db.select().from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, ownerUserId)))
      .limit(1);

    if (!note || !note.isPublic) return null;

    const tagMap = await this.getTagsForNotes([note.id]);
    const [profile] = await db.select().from(users).where(eq(users.id, ownerUserId)).limit(1);

    return {
      ...this.formatNote(note, tagMap.get(note.id) || []),
      owner_profile: profile
        ? { name: profile.name, email: profile.email, avatar: profile.avatar }
        : undefined,
    };
  }

  static async updatePresence(noteId: string, ownerUserId: string, viewerData: any) {
    const [note] = await db.select().from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, ownerUserId)))
      .limit(1);
      
    if (!note || !note.isPublic) return null;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 45_000);

    await db.insert(presence)
      .values({
        noteId,
        viewerId: viewerData.viewer_id,
        name: viewerData.name || 'Guest Viewer',
        email: viewerData.email || '',
        avatar: viewerData.avatar || '',
        lastSeenAt: now,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: [presence.noteId, presence.viewerId],
        set: {
          name: sql`EXCLUDED.name`,
          email: sql`EXCLUDED.email`,
          avatar: sql`EXCLUDED.avatar`,
          lastSeenAt: now,
          expiresAt,
        },
      });

    return true;
  }

  static async getActiveViewers(noteId: string, userId: string) {
    const [note] = await db.select().from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .limit(1);
      
    if (!note) return null;

    const now = new Date();

    // Cleanup expired viewers on read
    await db.delete(presence)
      .where(and(eq(presence.noteId, noteId), lte(presence.expiresAt, now)));

    const viewers = await db.select().from(presence)
      .where(and(
        eq(presence.noteId, noteId),
        gt(presence.expiresAt, now),
      ))
      .orderBy(desc(presence.lastSeenAt));

    return viewers
      .filter(v => v.viewerId !== userId)
      .map(v => ({
        viewer_id: v.viewerId,
        name: v.name || 'Guest Viewer',
        email: v.email || '',
        avatar: v.avatar || '',
        last_seen_at: v.lastSeenAt?.toISOString() ?? '',
      }));
  }

  static async listNotes(userId: string, filters: { search?: string; category?: string; tags?: string }) {
    const conditions = [eq(notes.userId, userId)];

    if (filters.category) {
      conditions.push(eq(notes.categoryId, filters.category));
    }

    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(or(ilike(notes.title, term), ilike(notes.contentText, term))!);
    }

    if (filters.tags) {
      const tagList = filters.tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        const matchingNoteIds = db
          .selectDistinct({ noteId: noteTags.noteId })
          .from(noteTags)
          .innerJoin(tags, eq(noteTags.tagId, tags.id))
          .where(inArray(tags.name, tagList));

        conditions.push(inArray(notes.id, matchingNoteIds));
      }
    }

    const noteRows = await db.select().from(notes)
      .where(and(...conditions))
      .orderBy(desc(notes.createdAt));

    const tagMap = await this.getTagsForNotes(noteRows.map(n => n.id));
    return noteRows.map(n => this.formatNote(n, tagMap.get(n.id) || []));
  }

  static async getNote(noteId: string, userId: string) {
    const [note] = await db.select().from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .limit(1);

    if (!note) return null;

    const tagMap = await this.getTagsForNotes([note.id]);
    return this.formatNote(note, tagMap.get(note.id) || []);
  }

  static async createNote(userId: string, data: any) {
    const now = new Date();

    const [created] = await db.insert(notes)
      .values({
        userId,
        categoryId: data.category || null,
        title: data.title || '',
        contentJson: data.content_json || {},
        contentText: data.content_text || '',
        isPublic: data.is_public || false,
        isPinned: data.isPinned || false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
      await this.syncNoteTags(created.id, userId, data.tags);
    }

    const tagMap = await this.getTagsForNotes([created.id]);
    return this.formatNote(created, tagMap.get(created.id) || []);
  }

  static async updateNote(noteId: string, userId: string, data: any) {
    const updateFields: Record<string, unknown> = { updatedAt: new Date() };

    if (data.title !== undefined) updateFields.title = data.title;
    if (data.content_json !== undefined) updateFields.contentJson = data.content_json;
    if (data.content_text !== undefined) updateFields.contentText = data.content_text;
    if (data.category !== undefined) updateFields.categoryId = data.category || null;
    if (data.is_public !== undefined) updateFields.isPublic = data.is_public;
    if (data.isPinned !== undefined) updateFields.isPinned = data.isPinned;

    const [updated] = await db.update(notes)
      .set(updateFields)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .returning();

    if (!updated) return null;

    if (data.tags !== undefined && Array.isArray(data.tags)) {
      await this.syncNoteTags(noteId, userId, data.tags);
    }

    const tagMap = await this.getTagsForNotes([updated.id]);
    return this.formatNote(updated, tagMap.get(updated.id) || []);
  }

  static async deleteNote(noteId: string, userId: string) {
    const result = await db.delete(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .returning();

    return result.length > 0;
  }
}
