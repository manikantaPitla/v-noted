import {
  pgTable,
  text,
  uuid,
  timestamp,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Users ───

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  avatar: text('avatar').default(''),
  accentColor: text('accent_color').default('#818CF8'),
  theme: text('theme').default('dark'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

// ─── Categories ───

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => ({
  userIdx: index('idx_categories_user').on(table.userId),
}));

// ─── Tags ───

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdx: index('idx_tags_user').on(table.userId),
  uniqueName: uniqueIndex('idx_tags_user_name').on(table.userId, table.name),
}));

// ─── Notes ───

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  title: text('title').default(''),
  contentJson: jsonb('content_json').default({}),
  contentText: text('content_text').default(''),
  isPublic: boolean('is_public').default(false),
  isPinned: boolean('is_pinned').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdx: index('idx_notes_user').on(table.userId),
  userCreatedIdx: index('idx_notes_user_created').on(table.userId, table.createdAt),
}));

// ─── Note Tags (join table) ───

export const noteTags = pgTable('note_tags', {
  noteId: uuid('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.noteId, table.tagId] }),
  tagIdx: index('idx_note_tags_tag').on(table.tagId),
}));

// ─── Presence ───

export const presence = pgTable('presence', {
  id: uuid('id').primaryKey().defaultRandom(),
  noteId: uuid('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  viewerId: text('viewer_id').notNull(),
  name: text('name').default('Guest Viewer'),
  email: text('email').default(''),
  avatar: text('avatar').default(''),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (table) => ({
  noteIdx: index('idx_presence_note').on(table.noteId),
  uniqueViewer: uniqueIndex('idx_presence_note_viewer').on(table.noteId, table.viewerId),
}));

// ─── Relations (for Drizzle relational queries) ───

export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
  categories: many(categories),
  tags: many(tags),
}));

export const categoriesRelations = relations(categories, ({ one }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, { fields: [tags.userId], references: [users.id] }),
  noteTags: many(noteTags),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
  categoryRef: one(categories, { fields: [notes.categoryId], references: [categories.id] }),
  noteTags: many(noteTags),
}));

export const noteTagsRelations = relations(noteTags, ({ one }) => ({
  note: one(notes, { fields: [noteTags.noteId], references: [notes.id] }),
  tag: one(tags, { fields: [noteTags.tagId], references: [tags.id] }),
}));

export const presenceRelations = relations(presence, ({ one }) => ({
  note: one(notes, { fields: [presence.noteId], references: [notes.id] }),
}));
