"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/actions/require-user";
import { prisma } from "@/lib/db";

/**
 * Creates a new user message branch from an existing message step.
 */
export async function createBranch(messageId: string, newUserMessage: string) {
  const user = await requireUser();
  
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: true },
  });

  if (!message || message.conversation.userId !== user.id) {
    throw new Error("Message not found");
  }

  // Get sibling count to name the new branch
  const siblingsCount = await prisma.message.count({
    where: {
      conversationId: message.conversationId,
      parentId: message.parentId,
    },
  });

  const branchName = `Branch ${siblingsCount + 1}`;

  // Create the new branched user message
  const newMsg = await prisma.message.create({
    data: {
      conversationId: message.conversationId,
      role: "USER",
      status: "COMPLETE",
      content: newUserMessage.trim(),
      parentId: message.parentId,
      branchName,
      isMainBranch: false,
    },
  });

  revalidatePath(`/c/${message.conversationId}`);
  return newMsg;
}

/**
 * Lists all sibling branches at a specific message step.
 */
export async function listBranches(messageId: string) {
  const user = await requireUser();

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: true },
  });

  if (!message || message.conversation.userId !== user.id) {
    throw new Error("Message not found");
  }

  return prisma.message.findMany({
    where: {
      conversationId: message.conversationId,
      parentId: message.parentId,
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Renames a specific branch.
 */
export async function renameBranch(messageId: string, newName: string) {
  const user = await requireUser();

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: true },
  });

  if (!message || message.conversation.userId !== user.id) {
    throw new Error("Message not found");
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { branchName: newName.trim() },
  });

  revalidatePath(`/c/${message.conversationId}`);
  return updated;
}

/**
 * Deletes a message branch and its descendants (automatic via cascade).
 */
export async function deleteBranch(messageId: string) {
  const user = await requireUser();

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: true },
  });

  if (!message || message.conversation.userId !== user.id) {
    throw new Error("Message not found");
  }

  await prisma.message.delete({
    where: { id: messageId },
  });

  revalidatePath(`/c/${message.conversationId}`);
  return { id: messageId, conversationId: message.conversationId };
}
