import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

/** Default chat model (Google Gemini 1.5 Flash). */
export const DEFAULT_CHAT_MODEL = "google/gemini-2.5-flash";

/**
 * Returns an OpenRouter language model instance for chat completions.
 *
 * @param modelId - Optional model identifier; falls back to {@link DEFAULT_CHAT_MODEL}.
 */
export function getChatModel(modelId?: string | null) {
  return openrouter(modelId || DEFAULT_CHAT_MODEL);
}
