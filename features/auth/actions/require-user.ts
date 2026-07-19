"use server"

import { auth } from "@clerk/nextjs/server";
import { onBoard } from "./onboard";

/**
 * Ensures the request is authenticated and the user record is synced
 * with the local Prisma database (get-or-create via onBoard).
 *
 * @returns The Prisma `User` linked to the current Clerk session.
 * @throws {Error} When no Clerk session is present.
 */
export async function requireUser() {
    await auth.protect();
    return onBoard();
}
