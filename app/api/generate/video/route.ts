import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateVideo } from '@/lib/ai';
import { checkCredits, decrementCredits } from '@/lib/credits';

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

        const { prompt, duration = '4s', images = [] } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // Parse duration string to number
        const durationSeconds = parseInt(duration.replace('s', ''), 10) || 4;

        const videoUrl = await generateVideo(prompt, durationSeconds, images);

        // Deduct credits after successful generation
        const remainingCredits = await decrementCredits(userId, 'video');

        return NextResponse.json({
            videoUrl,
            credits: remainingCredits,
        });
    } catch (error) {
        console.error('[Video Generation Error]', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate video' },
            { status: 500 }
        );
    }
}

