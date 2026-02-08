import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

// GET single project with canvas state
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        const { id } = await params;

        const project = await db.query.projects.findFirst({
            where: eq(schema.projects.id, id),
            with: {
                canvasState: true,
                assets: true,
                folder: true,
            },
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Check ownership (unless public)
        if (!project.isPublic && project.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({ project });
    } catch (error) {
        console.error('[Project GET Error]', error);
        return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
    }
}

// PATCH update project (name, canvas state, etc.)
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
        const { name, description, nodes, edges, viewport, thumbnail, folderId } = body;

        // Verify ownership before update
        const project = await db.query.projects.findFirst({
            where: and(eq(schema.projects.id, id), eq(schema.projects.userId, userId)),
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
        }

        // Update project metadata if provided
        if (name !== undefined || description !== undefined || thumbnail !== undefined || folderId !== undefined) {
            await db.update(schema.projects)
                .set({
                    ...(name !== undefined && { name }),
                    ...(description !== undefined && { description }),
                    ...(thumbnail !== undefined && { thumbnail }),
                    ...(folderId !== undefined && { folderId }),
                    updatedAt: new Date(),
                })
                .where(eq(schema.projects.id, id));
        }

        // Update canvas state if provided
        if (nodes !== undefined || edges !== undefined || viewport !== undefined) {
            await db.update(schema.canvasStates)
                .set({
                    ...(nodes !== undefined && { nodes }),
                    ...(edges !== undefined && { edges }),
                    ...(viewport !== undefined && { viewport }),
                    updatedAt: new Date(),
                })
                .where(eq(schema.canvasStates.projectId, id));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Project PATCH Error]', error);
        return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }
}

// DELETE project
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

        // Verify ownership before delete
        const result = await db.delete(schema.projects)
            .where(and(eq(schema.projects.id, id), eq(schema.projects.userId, userId)))
            .returning();

        if (result.length === 0) {
            return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Project DELETE Error]', error);
        return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }
}

