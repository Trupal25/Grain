import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateChat } from '@/lib/ai';
import { checkCredits, decrementCredits } from '@/lib/credits';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            messages,
            model = 'gemini-2.0-flash-lite',
            attachments = [],
            context = ''
        } = await request.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
        }

        // Check credits
        const hasCredits = await checkCredits(userId, 'text');
        if (!hasCredits) {
            return NextResponse.json(
                { error: 'Insufficient credits.' },
                { status: 402 }
            );
        }

        const text = await generateChat(messages, model, attachments, context);

        // Deduct credits
        const remainingCredits = await decrementCredits(userId, 'text');

        return NextResponse.json({
            text,
            credits: remainingCredits,
        });
    } catch (error) {
        console.error('[Chat Generation Error]', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate chat response' },
            { status: 500 }
        );
    }
}
