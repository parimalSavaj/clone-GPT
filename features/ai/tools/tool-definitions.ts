import { tool } from "ai";
import { z } from "zod";
import { searchWeb } from "./web-search";

/**
 * AI Tool definition for web searching.
 */
export const webSearchTool = tool({
  description: "Search the web for real-time information, weather, news, or general knowledge questions.",
  inputSchema: z.object({
    query: z.string().describe("The search query to execute on the web."),
  }),
  execute: async ({ query }) => {
    return searchWeb(query);
  },
});
