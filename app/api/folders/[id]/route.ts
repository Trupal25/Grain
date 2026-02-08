import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

// GET single folder with children
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const folder = await db.query.folders.findFirst({
            where: and(eq(schema.folders.id, id), eq(schema.folders.userId, userId)),
            with: {
                children: true,
                projects: true,
                documents: true,
            },
        });

        if (!folder) {
            return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
        }

        return NextResponse.json({ folder });
    } catch (error) {
        console.error('[Folder GET Error]', error);
        return NextResponse.json({ error: 'Failed to fetch folder' }, { status: 500 });
    }
}

// PATCH update folder (rename, move, change icon)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { name, parentFolderId, icon } = body;

        // Verify folder exists and belongs to user
        const existingFolder = await db.query.folders.findFirst({
            where: and(eq(schema.folders.id, id), eq(schema.folders.userId, userId)),
        });

        if (!existingFolder) {
            return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
        }

        // Prevent moving folder into itself or its descendants
        if (parentFolderId === id) {
            return NextResponse.json({ error: 'Cannot move folder into itself' }, { status: 400 });
        }

        // Verify new parent folder exists (if provided)
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

        const [updated] = await db.update(schema.folders)
            .set({
                ...(name !== undefined && { name }),
                ...(parentFolderId !== undefined && { parentFolderId }),
                ...(icon !== undefined && { icon }),
                updatedAt: new Date(),
            })
            .where(eq(schema.folders.id, id))
            .returning();

        return NextResponse.json({ folder: updated });
    } catch (error) {
        console.error('[Folder PATCH Error]', error);
        return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 });
    }
}

// DELETE folder (cascade deletes children)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify and delete folder
        const result = await db.delete(schema.folders)
            .where(and(eq(schema.folders.id, id), eq(schema.folders.userId, userId)))
            .returning();

        if (result.length === 0) {
            return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Folder DELETE Error]', error);
        return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
    }
}
