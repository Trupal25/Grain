
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export async function PATCH(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id, type, updates } = await request.json();

        if (!id || !type || !updates) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let table;
        switch (type) {
            case 'folder': table = schema.folders; break;
            case 'project': table = schema.projects; break;
            case 'document': table = schema.documents; break;
            case 'link': table = schema.links; break;
            case 'file': table = schema.files; break;
            default: return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        const cleanUpdates: any = { ...updates };

        // Map 'name' update to 'title' for links if strictly needed, but let's assume frontend sends right field or we map it generically
        // Actually, frontend will likely send 'name' for everything for simplicity in "Rename" dialog
        if (updates.name && type === 'link') {
            cleanUpdates.title = updates.name;
            delete cleanUpdates.name;
        }

        // Special handling for folder parent (parentFolderId vs folderId)
        if (updates.folderId !== undefined && type === 'folder') {
            cleanUpdates.parentFolderId = updates.folderId;
            delete cleanUpdates.folderId;
        }

        // Ensure we don't update immutable fields or unauthorized ones (userId is guarded by where clause)
        delete cleanUpdates.id;
        delete cleanUpdates.userId;
        delete cleanUpdates.createdAt;

        cleanUpdates.updatedAt = new Date();

        await db.update(table as any)
            .set(cleanUpdates)
            .where(and(eq(table.id, id), eq(table.userId, userId)));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Item PATCH Error]', error);
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const type = searchParams.get('type');

        if (!id || !type) return NextResponse.json({ error: 'Missing id or type' }, { status: 400 });

        let table;
        switch (type) {
            case 'folder': table = schema.folders; break;
            case 'project': table = schema.projects; break;
            case 'document': table = schema.documents; break;
            case 'link': table = schema.links; break;
            case 'file': table = schema.files; break;
            default: return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        await db.delete(table as any)
            .where(and(eq(table.id, id), eq(table.userId, userId)));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Item DELETE Error]', error);
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }
}
