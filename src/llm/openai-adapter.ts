import OpenAI from "openai";
import type {
  ILLMClient,
  LLMMessage,
  LLMResponse,
  ToolDefinition,
  ToolCall,
} from "./types.js";
import type { Config } from "../config.js";

type OAIMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export class OpenAIAdapter implements ILLMClient {
  private client: OpenAI;
  private model: string;
  private maxTokens: number;

  constructor(cfg: Config) {
    this.client = new OpenAI({ apiKey: cfg.LLM_API_KEY, baseURL: cfg.LLM_BASEURL });
    this.model = cfg.LLM_MODEL_NAME;
    this.maxTokens = cfg.LLM_MAX_TOKENS;
  }

  async chat(messages: LLMMessage[], tools?: ToolDefinition[]): Promise<LLMResponse> {
    const oaiMessages = messages.map((m) => this.toOAIMessage(m));
    const oaiTools = tools?.map((t) => ({
      type: "function" as const,
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }));

    const resp = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: this.maxTokens,
      messages: oaiMessages,
      ...(oaiTools?.length ? { tools: oaiTools } : {}),
    });

    const choice = resp.choices[0];
    const msg = choice.message;

    const toolCalls: ToolCall[] | undefined = msg.tool_calls?.map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments),
    }));

    return {
      content: msg.content ?? "",
      toolCalls: toolCalls?.length ? toolCalls : undefined,
      usage: resp.usage
        ? { promptTokens: resp.usage.prompt_tokens, completionTokens: resp.usage.completion_tokens }
        : undefined,
    };
  }

  private toOAIMessage(m: LLMMessage): OAIMessage {
    if (m.role === "tool") {
      return { role: "tool", content: m.content, tool_call_id: m.toolCallId! };
    }
    if (m.role === "assistant" && m.toolCalls?.length) {
      return {
        role: "assistant",
        content: m.content || null,
        tool_calls: m.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
        })),
      };
    }
    return { role: m.role as "system" | "user" | "assistant", content: m.content };
  }
}
