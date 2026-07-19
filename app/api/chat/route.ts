import { getChatModel } from "@/features/ai/utils/model";
import { streamText, convertToModelMessages } from "ai";

/**
 * POST /api/chat — Streams an AI assistant reply for a conversation (basic dev version).
 */
export async function POST(req: Request) {
    const { message, id }: { message: any; id: string } = await req.json();

    if (!message || !id) {
        return new Response("Missing message or conversation id", { status: 400 });
    }

    const result = streamText({
        model: getChatModel(),
        messages: await convertToModelMessages([message]),
    });

    return result.toTextStreamResponse();
}
