"use server";

import { requireUser } from "@/features/auth/actions/require-user";
import { prisma } from "@/lib/db";

/**
 * Server action that creates a new conversation titled "New Chat".
 *
 * @returns The ID of the newly created conversation.
 */
export async function startNewChat(){
    const user = await requireUser();

    // Check if the user's most recent conversation has no messages
    const lastConversation = await prisma.conversation.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
            messages: {
                take: 1
            }
        }
    });

    // If it exists and is empty, reuse it
    if (lastConversation && lastConversation.messages.length === 0) {
        return lastConversation.id;
    }

    // Otherwise, create a new one
    const conversation = await prisma.conversation.create({
        data:{
            userId:user.id,
            title:"New Chat"
        }
    });

    return conversation.id;
}
