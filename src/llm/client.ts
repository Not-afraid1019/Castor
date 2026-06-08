import type { ILLMClient } from "./types.js";
import type { Config } from "../config.js";
import { OpenAIAdapter } from "./openai-adapter.js";
import { AnthropicAdapter } from "./anthropic-adapter.js";

export function createLLMClient(cfg: Config): ILLMClient {
  if (cfg.LLM_PROTOCOL === "anthropic") {
    return new AnthropicAdapter(cfg);
  }
  return new OpenAIAdapter(cfg);
}
