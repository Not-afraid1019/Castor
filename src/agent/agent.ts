import type { ILLMClient, LLMMessage } from "../llm/types.js";
import type { ToolRegistry } from "../tools/registry.js";
import type { IConversationStore, Conversation } from "../memory/types.js";
import { buildSystemPrompt } from "./prompt.js";
import { logger } from "../logger.js";

const MAX_TOOL_ROUNDS = 10;

export class Agent {
  constructor(
    private llm: ILLMClient,
    private tools: ToolRegistry,
    private store: IConversationStore,
  ) {}

  async handleMessage(conversationId: string, userMessage: string): Promise<string> {
    // Load or create conversation
    let conversation = await this.store.load(conversationId);
    if (!conversation) {
      conversation = {
        id: conversationId,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Build messages with system prompt
    const systemMsg: LLMMessage = { role: "system", content: buildSystemPrompt() };
    conversation.messages.push({ role: "user", content: userMessage });

    const messages: LLMMessage[] = [systemMsg, ...conversation.messages];
    const toolDefs = this.tools.getDefinitions();

    // Agent loop with error recovery
    let rounds = 0;
    while (rounds < MAX_TOOL_ROUNDS) {
      rounds++;
      logger.debug({ round: rounds }, "LLM call");

      let response;
      try {
        response = await this.llm.chat(messages, toolDefs);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error({ error: msg, round: rounds }, "LLM call failed");
        const errorReply = "抱歉，AI 服务暂时不可用，请稍后再试。";
        conversation.messages.push({ role: "assistant", content: errorReply });
        conversation.updatedAt = new Date().toISOString();
        await this.store.save(conversation);
        return errorReply;
      }

      if (!response.toolCalls?.length) {
        // Final text response
        const reply = response.content;
        conversation.messages.push({ role: "assistant", content: reply });
        conversation.updatedAt = new Date().toISOString();
        await this.store.save(conversation);
        return reply;
      }

      // Process tool calls
      const assistantMsg: LLMMessage = {
        role: "assistant",
        content: response.content,
        toolCalls: response.toolCalls,
      };
      messages.push(assistantMsg);
      conversation.messages.push(assistantMsg);

      for (const tc of response.toolCalls) {
        logger.info({ tool: tc.name, args: tc.arguments }, "Executing tool");
        // Tools already have internal error handling in registry, but wrap for safety
        const result = await this.tools.execute(tc.name, {
          ...tc.arguments,
          conversation_id: conversationId,
        });
        const toolMsg: LLMMessage = {
          role: "tool",
          content: result,
          toolCallId: tc.id,
          name: tc.name,
        };
        messages.push(toolMsg);
        conversation.messages.push(toolMsg);
      }
    }

    // If we hit the max rounds, return what we have
    const fallback = "已达到最大工具调用轮数，以上是我目前完成的内容。";
    conversation.messages.push({ role: "assistant", content: fallback });
    conversation.updatedAt = new Date().toISOString();
    await this.store.save(conversation);
    return fallback;
  }
}
