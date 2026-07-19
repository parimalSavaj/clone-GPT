"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

/**
 * Syncs the signed-in Clerk user into the local Prisma `User` table (upsert).
 *
 * @returns The created or updated Prisma user record.
 * @throws {Error} When no Clerk session is present.
 */
export async function onBoard() {
    const clerkUser = await currentUser();

    if (!clerkUser) {
        throw new Error("Unauthorized")
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;

    // Find if a user record already exists with this clerkId
    let user = await prisma.user.findUnique({
        where: { clerkId: clerkUser.id }
    });

    // If not found by clerkId, search by email to resolve potential unique constraint conflicts
    if (!user && email) {
        user = await prisma.user.findUnique({
            where: { email }
        });
    }

    if (user) {
        return prisma.user.update({
            where: { id: user.id },
            data: {
                clerkId: clerkUser.id,
                email,
                firstName: clerkUser.firstName,
                lastName: clerkUser.lastName,
                imageUrl: clerkUser.imageUrl
            }
        });
    }

    return prisma.user.create({
        data: {
            clerkId: clerkUser.id,
            email,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl
        }
    });
}
