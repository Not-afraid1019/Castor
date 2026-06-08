import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const configSchema = z.object({
  // LLM
  LLM_API_KEY: z.string().min(1),
  LLM_BASEURL: z.string().url(),
  LLM_MODEL_NAME: z.string().min(1),
  LLM_PROTOCOL: z.enum(["openai", "anthropic"]).optional(),
  LLM_MAX_TOKENS: z.coerce.number().int().positive().default(4096),

  // Feishu
  FEISHU_APP_ID: z.string().optional(),
  FEISHU_APP_SECRET: z.string().optional(),

  // Web Search
  WEB_SEARCH_PROVIDER: z.string().optional(),
  WEB_SEARCH_API_KEY: z.string().optional(),

  // Agent
  DATA_DIR: z.string().default("./data"),
  SCRIPT_TIMEOUT: z.coerce.number().int().positive().default(30000),
  MAX_CONVERSATION_MESSAGES: z.coerce.number().int().positive().default(50),
});

export type Config = z.infer<typeof configSchema>;

function detectProtocol(baseUrl: string, model: string): "openai" | "anthropic" {
  if (baseUrl.includes("anthropic")) return "anthropic";
  if (model.startsWith("claude")) return "anthropic";
  return "openai";
}

export function loadConfig(): Config {
  const raw = configSchema.parse(process.env);
  if (!raw.LLM_PROTOCOL) {
    raw.LLM_PROTOCOL = detectProtocol(raw.LLM_BASEURL, raw.LLM_MODEL_NAME);
  }
  return raw;
}

export const config = loadConfig();
