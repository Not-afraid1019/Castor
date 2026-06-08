import Anthropic from "@anthropic-ai/sdk";
import type {
  ILLMClient,
  LLMMessage,
  LLMResponse,
  ToolDefinition,
  ToolCall,
} from "./types.js";
import type { Config } from "../config.js";
import { withRetry } from "../utils/retry.js";

export class AnthropicAdapter implements ILLMClient {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;

  constructor(cfg: Config) {
    this.client = new Anthropic({
      apiKey: cfg.LLM_API_KEY,
      baseURL: cfg.LLM_BASEURL,
    });
    this.model = cfg.LLM_MODEL_NAME;
    // Anthropic requires max_tokens; default to 8192 (let context window be the real limit)
    this.maxTokens = cfg.LLM_MAX_TOKENS ?? 8192;
  }

  async chat(messages: LLMMessage[], tools?: ToolDefinition[]): Promise<LLMResponse> {
    const systemMsg = messages.find((m) => m.role === "system");
    const nonSystemMsgs = messages.filter((m) => m.role !== "system");

    const anthropicTools = tools?.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters as Anthropic.Tool["input_schema"],
    }));

    const anthropicMessages = nonSystemMsgs.map((m) => this.toAnthropicMessage(m));

    const resp = await withRetry(() =>
      this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        ...(systemMsg ? { system: systemMsg.content } : {}),
        messages: anthropicMessages,
        ...(anthropicTools?.length ? { tools: anthropicTools } : {}),
      }),
    );

    let content = "";
    const toolCalls: ToolCall[] = [];

    for (const block of resp.content) {
      if (block.type === "text") {
        content += block.text;
      } else if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: block.input as Record<string, unknown>,
        });
      }
    }

    return {
      content,
      toolCalls: toolCalls.length ? toolCalls : undefined,
      usage: {
        promptTokens: resp.usage.input_tokens,
        completionTokens: resp.usage.output_tokens,
      },
    };
  }

  private toAnthropicMessage(m: LLMMessage): Anthropic.MessageParam {
    if (m.role === "user") {
      return { role: "user", content: m.content };
    }
    if (m.role === "tool") {
      return {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: m.toolCallId!,
            content: m.content,
          },
        ],
      };
    }
    // assistant
    if (m.toolCalls?.length) {
      const blocks: Anthropic.ContentBlockParam[] = [];
      if (m.content) {
        blocks.push({ type: "text", text: m.content });
      }
      for (const tc of m.toolCalls) {
        blocks.push({ type: "tool_use", id: tc.id, name: tc.name, input: tc.arguments });
      }
      return { role: "assistant", content: blocks };
    }
    return { role: "assistant", content: m.content };
  }
}
