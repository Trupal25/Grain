import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { ensureUserExists } from '@/lib/user';

// GET all projects for the authenticated user
export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const projects = await db.query.projects.findMany({
            where: eq(schema.projects.userId, userId),
            orderBy: (p, { desc }) => [desc(p.updatedAt)],
            with: {
                folder: true,
            },
        });

        return NextResponse.json({ projects });
    } catch (error) {
        console.error('[Projects GET Error]', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to fetch projects', details: message }, { status: 500 });
    }
}

// POST create new project
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ensure user exists in database (fallback if webhook hasn't synced)
        const userCreated = await ensureUserExists(userId);
        if (!userCreated) {
            return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
        }

        const { name = 'Untitled Project', description, folderId } = await request.json();

        // Create project
        const [project] = await db.insert(schema.projects).values({
            userId,
            name,
            description,
            folderId: folderId || null,
        }).returning();

        // Create empty canvas state
        await db.insert(schema.canvasStates).values({
            projectId: project.id,
            nodes: '[]',
            edges: '[]',
        });

        return NextResponse.json({ project });
    } catch (error) {
        console.error('[Projects POST Error]', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to create project', details: message }, { status: 500 });
    }
}


