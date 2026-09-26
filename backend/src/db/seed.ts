import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users, categories, notes, tags, noteTags } from './schema';
import { eq, and } from 'drizzle-orm';
import { DEFAULT_COLORS, POPULAR_TAGS } from '../lib/constants';
import * as schema from './schema';

type Tx = Parameters<Parameters<NodePgDatabase<typeof schema>['transaction']>[0]>[0];

/**
 * Seeds default categories, tags, and a welcome note for a new or reset user.
 * Expects the user row to already exist in the database.
 */
export async function seedDefaults(tx: Tx, userId: string) {
  const now = new Date();

  const insertedCategories = await tx.insert(categories)
    .values([
      { userId, name: 'Work', color: DEFAULT_COLORS.WORK, createdAt: now },
      { userId, name: 'Personal', color: DEFAULT_COLORS.PERSONAL, createdAt: now },
      { userId, name: 'Others', color: DEFAULT_COLORS.OTHERS, createdAt: now },
    ])
    .returning();

  const insertedTags = await tx.insert(tags)
    .values(POPULAR_TAGS.map(name => ({ userId, name, createdAt: now })))
    .returning();

  const tagsByName = new Map(insertedTags.map(t => [t.name, t.id]));
  const workCategory = insertedCategories.find(c => c.name === 'Work');

  const [welcomeNote] = await tx.insert(notes)
    .values({
      userId,
      categoryId: workCategory?.id ?? null,
      title: 'Welcome to v-noted!',
      contentText: 'v-noted is a fast, minimal note-taking app designed for clarity and speed.',
      contentJson: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Welcome to v-noted!' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'v-noted is a fast, minimal note-taking app designed for clarity and speed.' }] },
        ],
      },
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const urgentId = tagsByName.get('urgent');
  const ideasId = tagsByName.get('ideas');
  const noteTagValues = [urgentId, ideasId]
    .filter((id): id is string => id !== undefined)
    .map(tagId => ({ noteId: welcomeNote.id, tagId }));

  if (noteTagValues.length > 0) {
    await tx.insert(noteTags).values(noteTagValues);
  }
}
