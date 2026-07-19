"use server";

import { requireUser } from "@/features/auth/actions/require-user";
import { prisma } from "@/lib/db";
import type { Message } from "@/lib/generated/prisma/client";

/**
 * Traverses upwards from messageId to find the complete chronological path from the root.
 */
export async function getMessagePath(messageId: string): Promise<Message[]> {
  const user = await requireUser();
  const path: Message[] = [];
  let currentId: string | null = messageId;

  while (currentId) {
    const msg: any = await prisma.message.findUnique({
      where: { id: currentId },
      include: { conversation: true },
    });

    if (!msg || msg.conversation.userId !== user.id) {
      break;
    }

    path.push(msg);
    currentId = msg.parentId;
  }

  return path.reverse();
}

/**
 * Fetes the entire message tree for client-side hierarchy reconstruction.
 */
export async function getBranchTree(conversationId: string) {
  const user = await requireUser();

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: user.id },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Resolves the active branch path. Prefers main branches, defaults to oldest children.
 */
export async function getActiveBranch(conversationId: string, messageId?: string): Promise<Message[]> {
  if (messageId) {
    return getMessagePath(messageId);
  }

  const user = await requireUser();

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: user.id },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const allMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });

  const path: Message[] = [];
  let current = allMessages.find((m) => m.parentId === null);

  while (current) {
    path.push(current);
    const currentId = current.id;
    const children = allMessages.filter((m) => m.parentId === currentId);

    if (children.length === 0) {
      break;
    }

    const mainChild = children.find((c) => c.isMainBranch);
    current = mainChild || children[0];
  }

  return path;
}
