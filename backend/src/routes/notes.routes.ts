import { Router } from 'express';
import { db } from '../db';
import { notes, noteTags, tags, users, presence } from '../db/schema';
import { eq, and, desc, ilike, or, inArray, gt, lte, sql } from 'drizzle-orm';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { verifyJwt } from '../lib/auth';

export const notesRouter = Router();
export const presenceRouter = Router();

// ─── Helpers ───

type NoteRow = typeof notes.$inferSelect;

function formatNote(row: NoteRow, tagNames: string[] = []) {
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

/**
 * Batch-fetches tag names for a set of note IDs. Returns a Map of noteId → tagName[].
 * Uses a single query regardless of the number of notes (avoids N+1).
 */
async function getTagsForNotes(noteIds: string[]): Promise<Map<string, string[]>> {
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

/**
 * Resolves tag names to tag IDs for a user, creating any that don't exist yet.
 * Returns an array of tag IDs.
 */
async function resolveTagIds(userId: string, tagNames: string[]): Promise<string[]> {
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

    // If onConflictDoNothing skipped some (race condition), fetch them
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

/**
 * Replaces all tags on a note. Deletes existing note_tags, inserts new ones.
 */
async function syncNoteTags(noteId: string, userId: string, tagNames: string[]) {
  await db.delete(noteTags).where(eq(noteTags.noteId, noteId));

  if (tagNames.length > 0) {
    const tagIds = await resolveTagIds(userId, tagNames);
    if (tagIds.length > 0) {
      await db.insert(noteTags)
        .values(tagIds.map(tagId => ({ noteId, tagId })))
        .onConflictDoNothing();
    }
  }
}

// ─── Public: Shared Note ───

// GET /notes/:id?u=USERID — Public share link (no auth required)
notesRouter.get('/:id', optionalAuth, async (req, res, next) => {
  const { u: ownerUserId } = req.query as { u?: string };

  // If no ?u= param, this is a regular authenticated GET — pass to next handler
  if (!ownerUserId) return next();

  try {
    const noteId = req.params.id;
    const [note] = await db.select().from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, ownerUserId)))
      .limit(1);

    if (!note || !note.isPublic) {
      return res.status(404).json({ error: 'Note not found or not public' });
    }

    const tagMap = await getTagsForNotes([note.id]);
    const [profile] = await db.select().from(users).where(eq(users.id, ownerUserId)).limit(1);

    return res.json({
      ...formatNote(note, tagMap.get(note.id) || []),
      owner_profile: profile
        ? { name: profile.name, email: profile.email, avatar: profile.avatar }
        : undefined,
    });
  } catch (err) {
    console.error('[notes/shared]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Presence ───

// POST /presence/:id?u=USERID — Heartbeat for viewer presence
presenceRouter.post('/presence/:id', optionalAuth, async (req, res) => {
  try {
    const noteId = req.params.id;
    const ownerUserId = req.query.u as string;
    if (!ownerUserId) return res.status(400).json({ error: 'Missing owner user ID' });

    // Verify note exists and is public
    const [note] = await db.select().from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, ownerUserId)))
      .limit(1);
    if (!note || !note.isPublic) return res.status(404).json({ error: 'Note not available' });

    // Determine viewer identity
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

    const viewerId = viewer.viewer_id?.trim();
    if (!viewerId) return res.status(400).json({ error: 'Missing viewer id' });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 45_000);

    // Atomic upsert — no race condition under concurrent heartbeats
    await db.insert(presence)
      .values({
        noteId,
        viewerId,
        name: viewer.name?.trim() || 'Guest Viewer',
        email: viewer.email || '',
        avatar: viewer.avatar || '',
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

    return res.json({ success: true });
  } catch (err) {
    console.error('[presence]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Authenticated Note Routes ───

// GET /notes/:id/viewers — Active viewers on a note
notesRouter.get('/:id/viewers', requireAuth, async (req, res) => {
  try {
    const noteId = req.params.id;
    const userId = req.userId!;

    const [note] = await db.select().from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .limit(1);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const now = new Date();

    // Delete expired presence records (cleanup on read)
    await db.delete(presence)
      .where(and(eq(presence.noteId, noteId), lte(presence.expiresAt, now)));

    // Fetch active viewers, excluding the note owner
    const viewers = await db.select().from(presence)
      .where(and(
        eq(presence.noteId, noteId),
        gt(presence.expiresAt, now),
      ))
      .orderBy(desc(presence.lastSeenAt));

    return res.json(
      viewers
        .filter(v => v.viewerId !== userId)
        .map(v => ({
          viewer_id: v.viewerId,
          name: v.name || 'Guest Viewer',
          email: v.email || '',
          avatar: v.avatar || '',
          last_seen_at: v.lastSeenAt?.toISOString() ?? '',
        }))
    );
  } catch (err) {
    console.error('[notes/viewers]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /notes — List all notes with optional search, category, and tag filters
notesRouter.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { search, category, tags: tagFilter } = req.query as {
      search?: string;
      category?: string;
      tags?: string;
    };

    const conditions = [eq(notes.userId, userId)];

    if (category) {
      conditions.push(eq(notes.categoryId, category));
    }

    if (search) {
      const term = `%${search}%`;
      conditions.push(or(ilike(notes.title, term), ilike(notes.contentText, term))!);
    }

    if (tagFilter) {
      const tagList = tagFilter.split(',').map(t => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        // Subquery: find notes that have at least one of the specified tags
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

    const tagMap = await getTagsForNotes(noteRows.map(n => n.id));
    return res.json(noteRows.map(n => formatNote(n, tagMap.get(n.id) || [])));
  } catch (err) {
    console.error('[notes/list]', err);
    return res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// GET /notes/:id — Get single note (authenticated, no ?u= param — handled by earlier middleware)
notesRouter.get('/:id', requireAuth, async (req, res) => {
  try {
    const noteId = req.params.id;
    if (noteId === 'undefined' || noteId === 'null') {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const [note] = await db.select().from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, req.userId!)))
      .limit(1);

    if (!note) return res.status(404).json({ error: 'Note not found' });

    const tagMap = await getTagsForNotes([note.id]);
    return res.json(formatNote(note, tagMap.get(note.id) || []));
  } catch (err) {
    console.error('[notes/get]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /notes — Create a new note
notesRouter.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const dto = req.body;
    const now = new Date();

    const [created] = await db.insert(notes)
      .values({
        userId,
        categoryId: dto.category || null,
        title: dto.title || '',
        contentJson: dto.content_json || {},
        contentText: dto.content_text || '',
        isPublic: dto.is_public || false,
        isPinned: dto.isPinned || false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (dto.tags && Array.isArray(dto.tags) && dto.tags.length > 0) {
      await syncNoteTags(created.id, userId, dto.tags);
    }

    const tagMap = await getTagsForNotes([created.id]);
    return res.status(201).json(formatNote(created, tagMap.get(created.id) || []));
  } catch (err) {
    console.error('[notes/create]', err);
    return res.status(500).json({ error: 'Failed to create note' });
  }
});

// PUT /notes/:id — Update an existing note
notesRouter.put('/:id', requireAuth, async (req, res) => {
  try {
    const noteId = req.params.id;
    const userId = req.userId!;
    if (noteId === 'undefined' || noteId === 'null') {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const dto = req.body;
    const updateFields: Record<string, unknown> = { updatedAt: new Date() };

    if (dto.title !== undefined) updateFields.title = dto.title;
    if (dto.content_json !== undefined) updateFields.contentJson = dto.content_json;
    if (dto.content_text !== undefined) updateFields.contentText = dto.content_text;
    if (dto.category !== undefined) updateFields.categoryId = dto.category || null;
    if (dto.is_public !== undefined) updateFields.isPublic = dto.is_public;
    if (dto.isPinned !== undefined) updateFields.isPinned = dto.isPinned;

    const [updated] = await db.update(notes)
      .set(updateFields)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Note not found' });

    if (dto.tags !== undefined && Array.isArray(dto.tags)) {
      await syncNoteTags(noteId, userId, dto.tags);
    }

    const tagMap = await getTagsForNotes([updated.id]);
    return res.json(formatNote(updated, tagMap.get(updated.id) || []));
  } catch (err) {
    console.error('[notes/update]', err);
    return res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE /notes/:id — Delete a note
notesRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const noteId = req.params.id;
    if (noteId === 'undefined' || noteId === 'null') {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const result = await db.delete(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, req.userId!)))
      .returning();

    if (result.length === 0) return res.status(404).json({ error: 'Note not found' });
    return res.json({ success: true });
  } catch (err) {
    console.error('[notes/delete]', err);
    return res.status(500).json({ error: 'Failed to delete note' });
  }
});
