import { z } from "zod";
import type { Tool } from "./types.js";
import { config } from "../config.js";

export const webSearchTool: Tool = {
  name: "web_search",
  description: "Search the web for information. Returns relevant snippets.",
  parameters: z.object({
    query: z.string().describe("Search query"),
    max_results: z.number().optional().describe("Max results to return (default 5)"),
  }),

  async execute(args) {
    const { query, max_results = 5 } = args as { query: string; max_results?: number };

    if (!config.WEB_SEARCH_API_KEY) {
      return "Error: Web search is not configured (WEB_SEARCH_API_KEY not set)";
    }

    if (config.WEB_SEARCH_PROVIDER === "tavily") {
      return await tavilySearch(query, max_results);
    }

    return `Error: Unknown search provider "${config.WEB_SEARCH_PROVIDER}"`;
  },
};

async function tavilySearch(query: string, maxResults: number): Promise<string> {
  const resp = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: config.WEB_SEARCH_API_KEY,
      query,
      max_results: maxResults,
      include_answer: true,
    }),
  });

  if (!resp.ok) {
    return `Error: Tavily API returned ${resp.status}`;
  }

  const data = (await resp.json()) as {
    answer?: string;
    results: { title: string; url: string; content: string }[];
  };

  let output = "";
  if (data.answer) {
    output += `Summary: ${data.answer}\n\n`;
  }
  for (const r of data.results) {
    output += `### ${r.title}\n${r.url}\n${r.content}\n\n`;
  }
  return output || "No results found";
}
