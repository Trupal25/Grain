
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, schema } from '@/lib/db';
import { ensureUserExists } from '@/lib/user';
import { eq, and } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ensure user exists in database
        await ensureUserExists(userId);

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folderId = formData.get('folderId') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
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

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = file.name.replace(/\s/g, '_');
        const uniqueFilename = `${uuidv4()}-${filename}`;

        // Ensure upload directory exists
        const uploadDir = join(process.cwd(), 'public/uploads');
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (error) {
            // Ignore if directory already exists
        }

        const filePath = join(uploadDir, uniqueFilename);
        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/${uniqueFilename}`;

        // Create file record in database
        const [fileRecord] = await db.insert(schema.files).values({
            userId,
            name: file.name,
            url: fileUrl,
            size: file.size,
            type: file.type,
            folderId: folderId || null,
        }).returning();

        return NextResponse.json({ file: fileRecord });
    } catch (error) {
        console.error('[Upload POST Error]', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
