import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, schema } from '@/lib/db';
import { eq, and, isNull, isNotNull } from 'drizzle-orm';
import { ensureUserExists } from '@/lib/user';

// GET all folders for the authenticated user
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const parentId = searchParams.get('parentId');
        const trash = searchParams.get('trash') === 'true';
        const starred = searchParams.get('starred') === 'true';
        const all = searchParams.get('all') === 'true';

        // Helper for trash filter
        // If trash=true, we want items where trashedAt IS NOT NULL
        // If trash=false (default), we want items where trashedAt IS NULL
        // AND match parentId (only for non-trash view, trash view is flat or can be filtered but let's make it flat for now)

        // Actually, let's keep it simple:
        // if trash=true, ignore parentId and return all trashed items
        // if trash=false, respect parentId and return non-trashed items

        // Get folders
        const folders = await db.query.folders.findMany({
            where: and(
                eq(schema.folders.userId, userId),
                trash
                    ? isNotNull(schema.folders.trashedAt)
                    : all
                        ? isNull(schema.folders.trashedAt)
                        : starred
                            ? and(eq(schema.folders.isStarred, true), isNull(schema.folders.trashedAt))
                            : and(isNull(schema.folders.trashedAt), parentId ? eq(schema.folders.parentFolderId, parentId) : isNull(schema.folders.parentFolderId))
            ),
            orderBy: (f, { asc }) => [asc(f.name)],
        });

        // Get projects
        const projects = await db.query.projects.findMany({
            where: and(
                eq(schema.projects.userId, userId),
                trash
                    ? isNotNull(schema.projects.trashedAt)
                    : starred
                        ? and(eq(schema.projects.isStarred, true), isNull(schema.projects.trashedAt))
                        : and(isNull(schema.projects.trashedAt), parentId ? eq(schema.projects.folderId, parentId) : isNull(schema.projects.folderId))
            ),
            orderBy: (p, { desc }) => [desc(p.updatedAt)],
        });

        // Get documents
        const documents = await db.query.documents.findMany({
            where: and(
                eq(schema.documents.userId, userId),
                trash
                    ? isNotNull(schema.documents.trashedAt)
                    : starred
                        ? and(eq(schema.documents.isStarred, true), isNull(schema.documents.trashedAt))
                        : and(isNull(schema.documents.trashedAt), parentId ? eq(schema.documents.folderId, parentId) : isNull(schema.documents.folderId))
            ),
            orderBy: (d, { desc }) => [desc(d.updatedAt)],
        });

        // Get links
        const links = await db.query.links.findMany({
            where: and(
                eq(schema.links.userId, userId),
                trash
                    ? isNotNull(schema.links.trashedAt)
                    : starred
                        ? and(eq(schema.links.isStarred, true), isNull(schema.links.trashedAt))
                        : and(isNull(schema.links.trashedAt), parentId ? eq(schema.links.folderId, parentId) : isNull(schema.links.folderId))
            ),
            orderBy: (l, { desc }) => [desc(l.updatedAt)],
        });

        // Get files
        const files = await db.query.files.findMany({
            where: and(
                eq(schema.files.userId, userId),
                trash
                    ? isNotNull(schema.files.trashedAt)
                    : starred
                        ? and(eq(schema.files.isStarred, true), isNull(schema.files.trashedAt))
                        : and(isNull(schema.files.trashedAt), parentId ? eq(schema.files.folderId, parentId) : isNull(schema.files.folderId))
            ),
            orderBy: (f, { desc }) => [desc(f.updatedAt)],
        });

        return NextResponse.json({ folders, projects, documents, links, files });
    } catch (error) {
        console.error('[Folders GET Error]', error);
        return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
    }
}

// POST create new folder
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ensure user exists in database
        await ensureUserExists(userId);

        const { name = 'Untitled Folder', parentFolderId, icon = '📁' } = await request.json();

        // Verify parent folder exists and belongs to user (if provided)
        if (parentFolderId) {
            const parentFolder = await db.query.folders.findFirst({
                where: and(
                    eq(schema.folders.id, parentFolderId),
                    eq(schema.folders.userId, userId)
                ),
            });
            if (!parentFolder) {
                return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 });
            }
        }

        const [folder] = await db.insert(schema.folders).values({
            userId,
            name,
            parentFolderId: parentFolderId || null,
            icon,
        }).returning();

        return NextResponse.json({ folder });
    } catch (error) {
        console.error('[Folders POST Error]', error);
        return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
    }
}
