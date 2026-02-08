import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCredits } from '@/lib/credits';

// GET current credit balance
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const credits = await getCredits(userId);

        return NextResponse.json({ credits });
    } catch (error) {
        console.error('[Credits GET Error]', error);
        return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
    }
}
