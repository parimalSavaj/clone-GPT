"use server";

import { prisma } from "@/lib/db";
import type { Prisma, ToolCallStatus } from "@/lib/generated/prisma/client";

/**
 * Saves a tool call record in the database with PENDING status.
 */
export async function saveToolCall(data: {
  id: string;
  messageId: string;
  toolName: string;
  arguments: any;
}) {
  return prisma.toolCall.upsert({
    where: { id: data.id },
    create: {
      id: data.id,
      messageId: data.messageId,
      toolName: data.toolName,
      arguments: data.arguments as Prisma.InputJsonValue,
      status: "PENDING",
    },
    update: {
      arguments: data.arguments as Prisma.InputJsonValue,
    },
  });
}

/**
 * Updates a tool call record in the database with the result payload.
 */
export async function updateToolCallResult(
  id: string,
  result: any,
  status: ToolCallStatus = "COMPLETE"
) {
  return prisma.toolCall.update({
    where: { id },
    data: {
      result: result as Prisma.InputJsonValue,
      status,
    },
  });
}

/**
 * Loads all tool calls associated with a message.
 */
export async function loadToolCalls(messageId: string) {
  return prisma.toolCall.findMany({
    where: { messageId },
    orderBy: { createdAt: "asc" },
  });
}
