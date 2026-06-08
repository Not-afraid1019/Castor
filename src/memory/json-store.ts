import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { IConversationStore, Conversation } from "./types.js";
import { config } from "../config.js";

export class JsonStore implements IConversationStore {
  private dir: string;

  constructor() {
    this.dir = path.join(config.DATA_DIR, "conversations");
  }

  async load(id: string): Promise<Conversation | null> {
    const filepath = this.filepath(id);
    try {
      const raw = await fs.readFile(filepath, "utf-8");
      return JSON.parse(raw) as Conversation;
    } catch {
      return null;
    }
  }

  async save(conversation: Conversation): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
    const filepath = this.filepath(conversation.id);
    // Trim old messages if max is configured
    const max = config.MAX_CONVERSATION_MESSAGES;
    if (max && conversation.messages.length > max) {
      // Keep system message(s) + latest messages
      const systemMsgs = conversation.messages.filter((m) => m.role === "system");
      const nonSystem = conversation.messages.filter((m) => m.role !== "system");
      conversation.messages = [...systemMsgs, ...nonSystem.slice(-max)];
    }
    await fs.writeFile(filepath, JSON.stringify(conversation, null, 2), "utf-8");
  }

  private filepath(id: string): string {
    return path.join(this.dir, `${id}.json`);
  }
}
