import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

// Treat empty strings as undefined for optional fields
const optStr = z.preprocess((v) => (v === "" ? undefined : v), z.string().optional());
const optEnum = <T extends [string, ...string[]]>(values: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), z.enum(values).optional());
const optNum = z.preprocess(
  (v) => (v === "" || v === undefined ? undefined : Number(v)),
  z.number().int().positive().optional(),
);

const configSchema = z.object({
  // LLM
  LLM_API_KEY: z.string().min(1),
  LLM_BASEURL: z.string().url(),
  LLM_MODEL_NAME: z.string().min(1),
  LLM_PROTOCOL: optEnum(["openai", "anthropic"]),
  LLM_MAX_TOKENS: optNum,

  // Feishu
  FEISHU_APP_ID: optStr,
  FEISHU_APP_SECRET: optStr,

  // Web Search
  WEB_SEARCH_PROVIDER: optStr,
  WEB_SEARCH_API_KEY: optStr,

  // Agent
  DATA_DIR: z.string().default("./data"),
  WORKSPACE_DIR: optStr,
  SCRIPT_TIMEOUT: z.coerce.number().int().positive().default(30000),
  MAX_CONVERSATION_MESSAGES: optNum,
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
