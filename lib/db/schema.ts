import { pgTable, text, timestamp, uuid, boolean, integer, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// TABLES
// ============================================================================

// Users (synced from Clerk via webhook or on first access)
export const users = pgTable('users', {
    id: text('id').primaryKey(), // Clerk user ID
    email: text('email').notNull(),
    name: text('name'),
    imageUrl: text('image_url'),
    credits: integer('credits').default(100).notNull(), // AI generation credits
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Folders (Drive-like hierarchy)
export const folders = pgTable('folders', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    parentFolderId: uuid('parent_folder_id').references((): AnyPgColumn => folders.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default('Untitled Folder'),
    icon: text('icon').default('📁'),
    isStarred: boolean('is_starred').default(false),
    trashedAt: timestamp('trashed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Documents (notes with rich content)
export const documents = pgTable('documents', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }),
    type: text('type').notNull().$type<'canvas' | 'note'>().default('note'),
    name: text('name').notNull().default('Untitled'),
    content: text('content').default('{}'), // JSON blob for Tiptap content
    thumbnail: text('thumbnail'),
    isPublic: boolean('is_public').default(false),
    isStarred: boolean('is_starred').default(false),
    trashedAt: timestamp('trashed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Projects (canvases) - legacy, migrating to documents
export const projects = pgTable('projects', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }),
    name: text('name').notNull().default('Untitled Project'),
    description: text('description'),
    thumbnail: text('thumbnail'),
    isPublic: boolean('is_public').default(false),
    isStarred: boolean('is_starred').default(false),
    trashedAt: timestamp('trashed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Canvas state (nodes and edges as JSON strings)
export const canvasStates = pgTable('canvas_states', {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    nodes: text('nodes').notNull().default('[]'),
    edges: text('edges').notNull().default('[]'),
    viewport: text('viewport').default('{"x":0,"y":0,"zoom":1}'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Generated assets (images, videos)
export const assets = pgTable('assets', {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    nodeId: text('node_id').notNull(),
    type: text('type').notNull().$type<'image' | 'video' | 'audio'>(),
    url: text('url').notNull(),
    prompt: text('prompt'),
    metadata: text('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Links (saved bookmarks)
export const links = pgTable('links', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }),
    url: text('url').notNull(),
    title: text('title'),
    description: text('description'),
    favicon: text('favicon'),
    image: text('image'), // OG image
    isStarred: boolean('is_starred').default(false),
    trashedAt: timestamp('trashed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User uploaded files
export const files = pgTable('files', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    url: text('url').notNull(),
    size: integer('size'),
    type: text('type'),
    isStarred: boolean('is_starred').default(false),
    trashedAt: timestamp('trashed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
    projects: many(projects),
    folders: many(folders),
    documents: many(documents),
    links: many(links),
    files: many(files),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
    user: one(users, { fields: [folders.userId], references: [users.id] }),
    parent: one(folders, { fields: [folders.parentFolderId], references: [folders.id], relationName: 'parentChild' }),
    children: many(folders, { relationName: 'parentChild' }),
    projects: many(projects),
    documents: many(documents),
    links: many(links),
    files: many(files),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
    user: one(users, { fields: [documents.userId], references: [users.id] }),
    folder: one(folders, { fields: [documents.folderId], references: [folders.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
    user: one(users, { fields: [projects.userId], references: [users.id] }),
    folder: one(folders, { fields: [projects.folderId], references: [folders.id] }),
    canvasState: one(canvasStates),
    assets: many(assets),
}));

export const canvasStatesRelations = relations(canvasStates, ({ one }) => ({
    project: one(projects, { fields: [canvasStates.projectId], references: [projects.id] }),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
    project: one(projects, { fields: [assets.projectId], references: [projects.id] }),
}));

export const linksRelations = relations(links, ({ one }) => ({
    user: one(users, { fields: [links.userId], references: [users.id] }),
    folder: one(folders, { fields: [links.folderId], references: [folders.id] }),
}));

export const filesRelations = relations(files, ({ one }) => ({
    user: one(users, { fields: [files.userId], references: [users.id] }),
    folder: one(folders, { fields: [files.folderId], references: [folders.id] }),
}));

// ============================================================================
// TYPES
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type CanvasState = typeof canvasStates.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
