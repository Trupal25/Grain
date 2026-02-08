import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, schema } from '@/lib/db';
import { eq, and, isNull } from 'drizzle-orm';
import { ensureUserExists } from '@/lib/user';

// GET all documents for the authenticated user
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const folderId = searchParams.get('folderId');
        const type = searchParams.get('type') as 'canvas' | 'note' | null;

        const documents = await db.query.documents.findMany({
            where: and(
                eq(schema.documents.userId, userId),
                folderId ? eq(schema.documents.folderId, folderId) : isNull(schema.documents.folderId),
                type ? eq(schema.documents.type, type) : undefined
            ),
            with: {
                folder: true,
            },
            orderBy: (d, { desc }) => [desc(d.updatedAt)],
        });

        return NextResponse.json({ documents });
    } catch (error) {
        console.error('[Documents GET Error]', error);
        return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }
}

// POST create new document
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ensure user exists in database
        await ensureUserExists(userId);

        const {
            name = 'Untitled',
            type = 'note',
            folderId,
            content = '{}',
        } = await request.json();

        // Verify folder exists and belongs to user (if provided)
        if (folderId) {
            const folder = await db.query.folders.findFirst({
                where: and(
                    eq(schema.folders.id, folderId),
                    eq(schema.folders.userId, userId)
                ),
            });
            if (!folder) {
                return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
            }
        }

        const [document] = await db.insert(schema.documents).values({
            userId,
            name,
            type,
            folderId: folderId || null,
            content,
        }).returning();

        return NextResponse.json({ document });
    } catch (error) {
        console.error('[Documents POST Error]', error);
        return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
    }
}
