import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateText, enhancePrompt } from '@/lib/ai';
import { checkCredits, decrementCredits } from '@/lib/credits';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check credits (text is cheap)
        const hasCredits = await checkCredits(userId, 'text');
        if (!hasCredits) {
            return NextResponse.json(
                { error: 'Insufficient credits. Please add more credits to continue.' },
                { status: 402 }
            );
        }

        const { prompt, action = 'generate', type = 'image' } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        let result: string;

        if (action === 'enhance') {
            result = await enhancePrompt(prompt, type);
        } else {
            result = await generateText(prompt);
        }

        // Deduct credits after successful generation
        const remainingCredits = await decrementCredits(userId, 'text');

        return NextResponse.json({
            text: result,
            credits: remainingCredits,
        });
    } catch (error) {
        console.error('[Text Generation Error]', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate text' },
            { status: 500 }
        );
    }
}

