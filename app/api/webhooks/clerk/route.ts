import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

interface ClerkUserData {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
}

interface WebhookEvent {
    type: string;
    data: ClerkUserData;
}

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.error('[Clerk Webhook] Missing CLERK_WEBHOOK_SECRET');
        return NextResponse.json(
            { error: 'Webhook secret not configured' },
            { status: 500 }
        );
    }

    // Get headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return NextResponse.json(
            { error: 'Missing svix headers' },
            { status: 400 }
        );
    }

    // Get body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Verify webhook
    const wh = new Webhook(WEBHOOK_SECRET);
    let event: WebhookEvent;

    try {
        event = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error('[Clerk Webhook] Verification failed:', err);
        return NextResponse.json(
            { error: 'Webhook verification failed' },
            { status: 400 }
        );
    }

    // Handle events
    const { type, data } = event;

    if (type === 'user.created' || type === 'user.updated') {
        const email = data.email_addresses[0]?.email_address || '';
        const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;

        try {
            // Upsert user
            await db
                .insert(schema.users)
                .values({
                    id: data.id,
                    email,
                    name,
                    imageUrl: data.image_url,
                })
                .onConflictDoUpdate({
                    target: schema.users.id,
                    set: {
                        email,
                        name,
                        imageUrl: data.image_url,
                        updatedAt: new Date(),
                    },
                });

            console.log(`[Clerk Webhook] User ${type}: ${data.id}`);
        } catch (error) {
            console.error('[Clerk Webhook] DB error:', error);
            return NextResponse.json(
                { error: 'Database error' },
                { status: 500 }
            );
        }
    }

    if (type === 'user.deleted') {
        try {
            await db
                .delete(schema.users)
                .where(eq(schema.users.id, data.id));

            console.log(`[Clerk Webhook] User deleted: ${data.id}`);
        } catch (error) {
            console.error('[Clerk Webhook] DB error:', error);
            return NextResponse.json(
                { error: 'Database error' },
                { status: 500 }
            );
        }
    }

    return NextResponse.json({ success: true });
}
