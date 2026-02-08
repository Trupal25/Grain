import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

// GET single document
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        const { id } = await params;

        const document = await db.query.documents.findFirst({
            where: eq(schema.documents.id, id),
            with: {
                folder: true,
            },
        });

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Check ownership (unless public)
        if (!document.isPublic && document.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({ document });
    } catch (error) {
        console.error('[Document GET Error]', error);
        return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
    }
}

// PATCH update document
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
        const { name, content, folderId, thumbnail, isPublic } = body;

        // Verify ownership
        const document = await db.query.documents.findFirst({
            where: and(eq(schema.documents.id, id), eq(schema.documents.userId, userId)),
        });

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Verify new folder if provided
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

        const [updated] = await db.update(schema.documents)
            .set({
                ...(name !== undefined && { name }),
                ...(content !== undefined && { content }),
                ...(folderId !== undefined && { folderId }),
                ...(thumbnail !== undefined && { thumbnail }),
                ...(isPublic !== undefined && { isPublic }),
                updatedAt: new Date(),
            })
            .where(eq(schema.documents.id, id))
            .returning();

        return NextResponse.json({ document: updated });
    } catch (error) {
        console.error('[Document PATCH Error]', error);
        return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }
}

// DELETE document
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

        const result = await db.delete(schema.documents)
            .where(and(eq(schema.documents.id, id), eq(schema.documents.userId, userId)))
            .returning();

        if (result.length === 0) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Document DELETE Error]', error);
        return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }
}
