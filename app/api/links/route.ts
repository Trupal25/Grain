
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, schema } from '@/lib/db';
import { ensureUserExists } from '@/lib/user';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ensure user exists in database
        await ensureUserExists(userId);

        const { url, title, folderId } = await request.json();

        // Validate URL
        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Verify folder exists and belongs to user (if provided)
        if (folderId) {
            const parentFolder = await db.query.folders.findFirst({
                where: and(
                    eq(schema.folders.id, folderId),
                    eq(schema.folders.userId, userId)
                ),
            });
            if (!parentFolder) {
                return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
            }
        }

        // Create link
        const [link] = await db.insert(schema.links).values({
            userId,
            url,
            title: title || url, // fallback to URL if no title provided
            folderId: folderId || null,
        }).returning();

        return NextResponse.json({ link });
    } catch (error) {
        console.error('[Links POST Error]', error);
        return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
    }
}
