import type { LLMMessage } from "../llm/types.js";

export interface Conversation {
  id: string;
  messages: LLMMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface IConversationStore {
  load(id: string): Promise<Conversation | null>;
  save(conversation: Conversation): Promise<void>;
}
