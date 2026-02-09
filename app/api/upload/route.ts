
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, schema } from '@/lib/db';
import { ensureUserExists } from '@/lib/user';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi({
    token: process.env.UPLOADTHING_TOKEN,
});

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

        // Upload to UploadThing
        const response = await utapi.uploadFiles([file]);

        if (response[0].error) {
            throw new Error(response[0].error.message);
        }

        const uploadedFile = response[0].data;

        // Create file record in database
        const [fileRecord] = await db.insert(schema.files).values({
            userId,
            name: file.name,
            url: uploadedFile.url,
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
