import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateVideo } from '@/lib/ai';
import { checkCredits, decrementCredits } from '@/lib/credits';
import { uploadBlob, generateBlobFilename } from '@/lib/storage';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check credits (video is more expensive)
        const hasCredits = await checkCredits(userId, 'video');
        if (!hasCredits) {
            return NextResponse.json(
                { error: 'Insufficient credits. Please add more credits to continue.' },
                { status: 402 }
            );
        }

        const { prompt, duration = '5s', images = [], model = 'veo-2' } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // Parse duration string to number
        const durationSeconds = parseInt(duration.replace('s', ''), 10) || 5;

        // Generate video using AI
        console.log('[API/Video] Starting generation for user:', userId, 'Model:', model);
        const googleVideoUrl = await generateVideo(prompt, durationSeconds, images, model);

        // Download video to buffer
        const videoRes = await fetch(googleVideoUrl);
        if (!videoRes.ok) {
            console.error('[API/Video] Failed to fetch generated video from Google:', videoRes.status, videoRes.statusText);
            throw new Error(`Failed to fetch generated video: ${videoRes.statusText}`);
        }

        const contentType = videoRes.headers.get('content-type') || 'video/mp4';
        const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
        console.log('[API/Video] Downloaded video:', { size: videoBuffer.length, contentType });
        console.log('[API/Video] Buffer header (hex):', videoBuffer.subarray(0, 32).toString('hex'));

        // Upload to UploadThing
        const extension = contentType.split('/')[1]?.split(';')[0] || 'mp4';
        const filename = generateBlobFilename(userId, 'video', extension);
        const videoUrl = await uploadBlob(videoBuffer, filename, contentType);

        // Deduct credits after successful generation
        const remainingCredits = await decrementCredits(userId, 'video');

        return NextResponse.json({
            videoUrl,
            credits: remainingCredits,
        });
    } catch (error) {
        console.error('[API/Video] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate video' },
            { status: 500 }
        );
    }
}
