import { tavily } from "@tavily/core";

// Initialize Tavily Client
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

interface CacheEntry {
  results: any[];
  answer: string | undefined;
  timestamp: number;
}

// In-memory cache for search results
const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Searches the web for a given query using the Tavily API (with caching).
 *
 * @param query - The search query string.
 * @returns An object containing results, an AI-synthesized answer, and optional error.
 */
export async function searchWeb(query: string) {
  const cacheKey = query.trim().toLowerCase();
  
  // Check if cache entry exists and is not expired
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[Cache Hit] Web search for: "${cacheKey}"`);
    return {
      results: cached.results,
      answer: cached.answer,
    };
  }

  try {
    console.log(`[API Call] Web search for: "${query}"`);
    const response = await tvly.search(query, {
      includeAnswer: true,
      maxResults: 5
    });

    // Save success response to cache
    searchCache.set(cacheKey, {
      results: response.results,
      answer: response.answer,
      timestamp: Date.now(),
    });

    return {
      results: response.results,
      answer: response.answer,
    };
  } catch (error: any) {
    console.error("Tavily search error:", error);
    return {
      results: [],
      answer: "",
      error: error.message || String(error),
    };
  }
}
