import * as lark from "@larksuiteoapi/node-sdk";
import type { ITransport, MessageHandler } from "./types.js";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { pickReactionEmoji } from "../utils/emoji-picker.js";

export class FeishuBotTransport implements ITransport {
  private wsClient?: lark.WSClient;
  private apiClient?: lark.Client;
  private processedMessages = new Set<string>();

  async start(handler: MessageHandler): Promise<void> {
    if (!config.FEISHU_APP_ID || !config.FEISHU_APP_SECRET) {
      throw new Error("FEISHU_APP_ID and FEISHU_APP_SECRET are required for Feishu transport");
    }

    this.apiClient = new lark.Client({
      appId: config.FEISHU_APP_ID,
      appSecret: config.FEISHU_APP_SECRET,
    });

    this.wsClient = new lark.WSClient({
      appId: config.FEISHU_APP_ID,
      appSecret: config.FEISHU_APP_SECRET,
      loggerLevel: lark.LoggerLevel.info,
    });

    const eventDispatcher = new lark.EventDispatcher({}).register({
      "im.message.receive_v1": async (data: any) => {
        try {
          await this.handleEvent(data, handler);
        } catch (err) {
          logger.error({ err }, "Error handling Feishu message");
        }
      },
    });

    await this.wsClient.start({ eventDispatcher });
    logger.info("Feishu WebSocket bot connected");
  }

  async stop(): Promise<void> {
    // WSClient doesn't expose a clean stop method
  }

  private async handleEvent(data: any, handler: MessageHandler): Promise<void> {
    const msg = data.message;
    if (!msg || msg.message_type !== "text") return;

    // Dedup by message_id
    const messageId: string = msg.message_id;
    if (this.processedMessages.has(messageId)) {
      logger.debug({ messageId }, "Duplicate message, skipping");
      return;
    }
    this.processedMessages.add(messageId);
    // Prevent memory leak: cap the dedup set
    if (this.processedMessages.size > 1000) {
      const first = this.processedMessages.values().next().value!;
      this.processedMessages.delete(first);
    }

    const content = JSON.parse(msg.content);
    let text: string = content.text || "";

    // Remove @bot mention prefix
    text = text.replace(/@_user_\d+\s*/g, "").trim();
    if (!text) return;

    // Determine conversation ID
    const chatType = msg.chat_type;
    const conversationId =
      chatType === "p2p" ? data.sender?.sender_id?.open_id || msg.chat_id : msg.chat_id;
    const senderId = data.sender?.sender_id?.open_id || "unknown";

    logger.info({ conversationId, senderId, text }, "Received message");

    // Add context-aware reaction to indicate "processing"
    const emoji = pickReactionEmoji(text);
    logger.debug({ emoji, text }, "Picked reaction emoji");
    const reactionId = await this.addReaction(messageId, emoji);

    try {
      const reply = await handler({ conversationId, text, senderId });

      // Send reply
      await this.apiClient!.im.message.create({
        params: { receive_id_type: "chat_id" },
        data: {
          receive_id: msg.chat_id,
          msg_type: "text",
          content: JSON.stringify({ text: reply }),
        },
      });
    } finally {
      // Remove thinking reaction after reply is sent (or on error)
      if (reactionId) {
        await this.removeReaction(messageId, reactionId);
      }
    }
  }

  private async addReaction(messageId: string, emoji: string): Promise<string | null> {
    try {
      const resp = await this.apiClient!.im.messageReaction.create({
        path: { message_id: messageId },
        data: { reaction_type: { emoji_type: emoji } },
      });
      return resp.data?.reaction_id ?? null;
    } catch (err) {
      logger.debug({ err, messageId }, "Failed to add reaction (non-critical)");
      return null;
    }
  }

  private async removeReaction(messageId: string, reactionId: string): Promise<void> {
    try {
      await this.apiClient!.im.messageReaction.delete({
        path: { message_id: messageId, reaction_id: reactionId },
      });
    } catch (err) {
      logger.debug({ err, messageId }, "Failed to remove reaction (non-critical)");
    }
  }
}
