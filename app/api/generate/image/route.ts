import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateImage } from '@/lib/ai';
import { uploadBlob, base64ToBuffer, generateBlobFilename } from '@/lib/storage';
import { checkCredits, decrementCredits } from '@/lib/credits';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check credits
        const hasCredits = await checkCredits(userId, 'image');
        if (!hasCredits) {
            return NextResponse.json(
                { error: 'Insufficient credits. Please add more credits to continue.' },
                { status: 402 }
            );
        }

        const { prompt, aspectRatio = '1:1', model = 'gemini-2.0-flash' } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // Generate image (returns base64 data URI)
        console.log('[API/Image] Starting generation for user:', userId, 'Model:', model);
        const imageDataUri = await generateImage(prompt, aspectRatio, model);

        // Convert base64 to buffer and upload to blob storage
        const { buffer, mimeType } = base64ToBuffer(imageDataUri);
        const extension = mimeType.split('/')[1] || 'png';
        const filename = generateBlobFilename(userId, 'image', extension);
        const imageUrl = await uploadBlob(buffer, filename, mimeType);

        // Deduct credits after successful generation
        const remainingCredits = await decrementCredits(userId, 'image');

        return NextResponse.json({
            imageUrl,
            credits: remainingCredits,
        });
    } catch (error) {
        console.error('[API/Image] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate image' },
            { status: 500 }
        );
    }
}

