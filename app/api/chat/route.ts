import { loadChatMessages, saveChatMessages } from "@/features/ai/actions/chat-store";
import { saveToolCall, updateToolCallResult } from "@/features/ai/actions/tool-store";
import { getChatModel } from "@/features/ai/utils/model";
import { availableTools } from "@/features/ai/tools";
import { requireUser } from "@/features/auth/actions/require-user";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { 
  convertToModelMessages, 
  createIdGenerator, 
  createUIMessageStreamResponse, 
  streamText, 
  toUIMessageStream, 
  isStepCount,
  type UIMessage 
} from "ai";

/**
 * POST /api/chat — Streams an AI assistant reply for a conversation (persisting tool calls).
 */
export async function POST(req: Request) {
    await auth.protect();

    const { message, id }: { message: UIMessage; id: string } = await req.json();

    if (!message || !id) {
        return new Response("Missing message or conversation id", { status: 400 });
    }

    const user = await requireUser();

    const conversation = await prisma.conversation.findFirst({
        where: {
            id,
            userId: user.id
        }
    });

    if (!conversation) {
        return new Response("Conversation not found", { status: 404 });
    }

    // Check if user message is already saved in database (i.e. was created as a branch)
    const dbMsg = await prisma.message.findUnique({
        where: { id: message.id }
    });

    let messages: UIMessage[] = [];
    if (dbMsg) {
        // Load the exact branch path ending at this user message
        messages = await loadChatMessages(id, message.id);
    } else {
        // Load the active path, append the new user message, and save it
        const previousMessages = await loadChatMessages(id);
        messages = [...previousMessages, message];
        await saveChatMessages(id, messages);
    }

    // Generate assistant message ID and create a database stub to avoid FK violation during step callbacks
    const generateMessageId = createIdGenerator({ prefix: "msg", size: 16 });
    const assistantMessageId = generateMessageId();

    await prisma.message.create({
        data: {
            id: assistantMessageId,
            conversationId: id,
            role: "ASSISTANT",
            status: "PENDING",
            content: "",
            parentId: message.id, // Link to the trigger user message
        }
    });

    const result = await streamText({
        model: getChatModel(conversation.model),
        system: conversation.systemPrompt ?? "You are ChaiGPT, a helpful assistant",
        messages: await convertToModelMessages(messages),
        tools: availableTools,
        stopWhen: isStepCount(5),
        onStepEnd: async (event) => {
            try {
                // Save tool calls generated in this step
                for (const call of event.toolCalls) {
                    await saveToolCall({
                        id: call.toolCallId,
                        messageId: assistantMessageId,
                        toolName: call.toolName,
                        arguments: call.input,
                    });
                }

                // Save tool execution results returned in this step
                for (const res of event.toolResults) {
                    const status = (res.output as any)?.error ? "ERROR" : "COMPLETE";
                    await updateToolCallResult(res.toolCallId, res.output, status);
                }
            } catch (dbError) {
                console.error("Failed to log tool execution to database:", dbError);
            }
        }
    });

    result.consumeStream();

    return createUIMessageStreamResponse({
        stream: toUIMessageStream({
           stream: result.stream,
           tools: availableTools,
           originalMessages: messages,
           generateMessageId: () => assistantMessageId,
           onEnd: async ({ messages: finalMessages }) => {
            try {
                await saveChatMessages(id, finalMessages, { updateTitle: true });
            } catch (error) {
                console.error(error);
            }
           }
        })
    });
}
