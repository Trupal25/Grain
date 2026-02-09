import { db, schema } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

// Cost per generation type (in credits)
const CREDIT_COSTS: Record<string, number> = {
    image: 5,
    video: 20,
    audio: 10,
    text: 1,
};

/**
 * Check if user has enough credits for a generation
 */
export async function checkCredits(
    userId: string,
    type: keyof typeof CREDIT_COSTS
): Promise<boolean> {
    const [user] = await db
        .select({ credits: schema.users.credits })
        .from(schema.users)
        .where(eq(schema.users.id, userId));

    console.log(`[Credits] Checking ${type} (cost: ${CREDIT_COSTS[type]}) for user ${userId}. Balance: ${user?.credits}`);

    if (!user) return false;
    return user.credits >= (CREDIT_COSTS[type] || 0);
}

/**
 * Decrement credits after successful generation
 */
export async function decrementCredits(
    userId: string,
    type: keyof typeof CREDIT_COSTS
): Promise<number> {
    const cost = CREDIT_COSTS[type] || 0;

    const [updated] = await db
        .update(schema.users)
        .set({
            credits: sql`${schema.users.credits} - ${cost}`,
            updatedAt: new Date(),
        })
        .where(eq(schema.users.id, userId))
        .returning({ credits: schema.users.credits });

    return updated?.credits ?? 0;
}

/**
 * Get current credit balance
 */
export async function getCredits(userId: string): Promise<number> {
    const [user] = await db
        .select({ credits: schema.users.credits })
        .from(schema.users)
        .where(eq(schema.users.id, userId));

    return user?.credits ?? 0;
}

/**
 * Add credits to a user (for purchasing or rewards)
 */
export async function addCredits(
    userId: string,
    amount: number
): Promise<number> {
    const [updated] = await db
        .update(schema.users)
        .set({
            credits: sql`${schema.users.credits} + ${amount}`,
            updatedAt: new Date(),
        })
        .where(eq(schema.users.id, userId))
        .returning({ credits: schema.users.credits });

    return updated?.credits ?? 0;
}
