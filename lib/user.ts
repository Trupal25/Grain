/**
 * User sync utility
 * Ensures user exists in database (fallback when webhook hasn't synced yet)
 */

import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';

const DEFAULT_CREDITS = 100;

/**
 * Ensure user exists in database, creating if necessary
 * This is a fallback for when Clerk webhook hasn't synced the user yet
 */
export async function ensureUserExists(userId: string): Promise<boolean> {
    try {
        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
            where: eq(schema.users.id, userId),
        });

        if (existingUser) {
            return true;
        }

        // Get user details from Clerk
        const clerkUser = await currentUser();
        if (!clerkUser || clerkUser.id !== userId) {
            console.error('[ensureUserExists] Could not get Clerk user');
            return false;
        }

        // Create user in database
        await db.insert(schema.users).values({
            id: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
            imageUrl: clerkUser.imageUrl || null,
            credits: DEFAULT_CREDITS,
        }).onConflictDoNothing();

        console.log('[ensureUserExists] Created user:', userId);
        return true;
    } catch (error) {
        console.error('[ensureUserExists] Error:', error);
        return false;
    }
}

/**
 * Get or create user, returning the user object
 */
export async function getOrCreateUser(userId: string) {
    await ensureUserExists(userId);

    return db.query.users.findFirst({
        where: eq(schema.users.id, userId),
    });
}
