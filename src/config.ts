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
  CASTOR_LLM_API_KEY: z.string().min(1),
  CASTOR_LLM_BASEURL: z.string().url(),
  CASTOR_LLM_MODEL_NAME: z.string().min(1),
  CASTOR_LLM_PROTOCOL: optEnum(["openai", "anthropic"]),
  CASTOR_LLM_MAX_TOKENS: optNum,

  // Feishu
  CASTOR_FEISHU_APP_ID: optStr,
  CASTOR_FEISHU_APP_SECRET: optStr,

  // Web Search
  CASTOR_WEB_SEARCH_PROVIDER: optStr,
  CASTOR_WEB_SEARCH_API_KEY: optStr,

  // Agent
  CASTOR_DATA_DIR: z.string().default("./data"),
  CASTOR_WORKSPACE_DIR: optStr,
  CASTOR_SCRIPT_TIMEOUT: z.coerce.number().int().positive().default(30000),
  CASTOR_MAX_CONVERSATION_MESSAGES: optNum,
});

type RawConfig = z.infer<typeof configSchema>;

// Export a friendlier Config type without the prefix
export interface Config {
  LLM_API_KEY: string;
  LLM_BASEURL: string;
  LLM_MODEL_NAME: string;
  LLM_PROTOCOL?: "openai" | "anthropic";
  LLM_MAX_TOKENS?: number;
  FEISHU_APP_ID?: string;
  FEISHU_APP_SECRET?: string;
  WEB_SEARCH_PROVIDER?: string;
  WEB_SEARCH_API_KEY?: string;
  DATA_DIR: string;
  WORKSPACE_DIR?: string;
  SCRIPT_TIMEOUT: number;
  MAX_CONVERSATION_MESSAGES?: number;
}

function stripPrefix(raw: RawConfig): Config {
  return {
    LLM_API_KEY: raw.CASTOR_LLM_API_KEY,
    LLM_BASEURL: raw.CASTOR_LLM_BASEURL,
    LLM_MODEL_NAME: raw.CASTOR_LLM_MODEL_NAME,
    LLM_PROTOCOL: raw.CASTOR_LLM_PROTOCOL as "openai" | "anthropic" | undefined,
    LLM_MAX_TOKENS: raw.CASTOR_LLM_MAX_TOKENS,
    FEISHU_APP_ID: raw.CASTOR_FEISHU_APP_ID,
    FEISHU_APP_SECRET: raw.CASTOR_FEISHU_APP_SECRET,
    WEB_SEARCH_PROVIDER: raw.CASTOR_WEB_SEARCH_PROVIDER,
    WEB_SEARCH_API_KEY: raw.CASTOR_WEB_SEARCH_API_KEY,
    DATA_DIR: raw.CASTOR_DATA_DIR,
    WORKSPACE_DIR: raw.CASTOR_WORKSPACE_DIR,
    SCRIPT_TIMEOUT: raw.CASTOR_SCRIPT_TIMEOUT,
    MAX_CONVERSATION_MESSAGES: raw.CASTOR_MAX_CONVERSATION_MESSAGES,
  };
}

function detectProtocol(baseUrl: string, model: string): "openai" | "anthropic" {
  if (baseUrl.includes("anthropic")) return "anthropic";
  if (model.startsWith("claude")) return "anthropic";
  return "openai";
}

export function loadConfig(): Config {
  const raw = configSchema.parse(process.env);
  const cfg = stripPrefix(raw);
  if (!cfg.LLM_PROTOCOL) {
    cfg.LLM_PROTOCOL = detectProtocol(cfg.LLM_BASEURL, cfg.LLM_MODEL_NAME);
  }
  return cfg;
}

export const config = loadConfig();
