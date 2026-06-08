import * as lark from "@larksuiteoapi/node-sdk";
import type { ITransport, MessageHandler } from "./types.js";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { splitMessage } from "../utils/message-split.js";
import { markdownToFeishuPost } from "../utils/feishu-rich-text.js";

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
      loggerLevel: lark.LoggerLevel.debug,
      onReady: () => {
        logger.info("Feishu WebSocket connection established");
      },
      onError: (err: any) => {
        logger.error({ err }, "Feishu WebSocket error");
      },
      onReconnecting: () => {
        logger.warn("Feishu WebSocket reconnecting...");
      },
    });

    const eventDispatcher = new lark.EventDispatcher({}).register({
      "im.message.receive_v1": (data: any) => {
        logger.info({ chatType: data?.message?.chat_type, msgType: data?.message?.message_type, messageId: data?.message?.message_id }, "Event im.message.receive_v1 triggered");
        logger.debug({ data: JSON.stringify(data).slice(0, 500) }, "Raw event received");
        // Don't await — return immediately so the SDK can process next event
        this.handleEvent(data, handler).catch((err) => {
          logger.error({ err }, "Error handling Feishu message");
        });
      },
      "im.chat.access_event.bot_p2p_chat_entered_v1": (data: any) => {
        logger.info({ data: JSON.stringify(data).slice(0, 200) }, "User entered p2p chat");
      },
    });

    await this.wsClient.start({ eventDispatcher });
    logger.info("Feishu WebSocket bot starting...");
  }

  async stop(): Promise<void> {
    // WSClient doesn't expose a clean stop method
  }

  private async handleEvent(data: any, handler: MessageHandler): Promise<void> {
    const msg = data.message;
    if (!msg) return;

    const chatType: string = msg.chat_type;
    const messageId: string = msg.message_id;

    // Handle unsupported message types
    if (msg.message_type !== "text") {
      // In p2p, notify user; in group only if @mentioned
      if (chatType === "p2p") {
        await this.sendReply(msg.chat_id, "暂不支持该消息类型，目前仅支持文本消息。", messageId);
      }
      return;
    }

    // Dedup by message_id
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

    // In group chat, only respond when @mentioned
    // The bot receives all group messages it can see; filter to only those mentioning it.
    // When the bot is @mentioned, its mention key (e.g. "@_user_1") appears in text and mentions array.
    if (chatType === "group") {
      const mentions: any[] = msg.mentions || [];
      if (!mentions.length) return;
      // Check that at least one mention key is present in the original text
      const hasBotMention = mentions.some((m: any) => text.includes(m.key));
      if (!hasBotMention) return;
    }

    // Remove @bot mention prefix
    text = text.replace(/@_user_\d+\s*/g, "").trim();
    if (!text) return;

    // Determine conversation ID
    const conversationId =
      chatType === "p2p" ? data.sender?.sender_id?.open_id || msg.chat_id : msg.chat_id;
    const senderId = data.sender?.sender_id?.open_id || "unknown";

    logger.info({ conversationId, senderId, text, chatType }, "Received message");

    // Add "Typing" reaction to indicate processing
    const reactionId = await this.addReaction(messageId, "Typing");

    try {
      const reply = await handler({ conversationId, text, senderId });
      await this.sendReply(msg.chat_id, reply, messageId);
    } finally {
      // Remove reaction after reply is sent (or on error)
      if (reactionId) {
        await this.removeReaction(messageId, reactionId);
      }
    }
  }

  private async sendReply(chatId: string, text: string, replyMessageId?: string): Promise<void> {
    const chunks = splitMessage(text);

    for (let i = 0; i < chunks.length; i++) {
      const postContent = markdownToFeishuPost(chunks[i]);

      if (i === 0 && replyMessageId) {
        // First chunk: reply to the original message (with quote)
        await this.apiClient!.im.message.reply({
          path: { message_id: replyMessageId },
          data: {
            msg_type: "post",
            content: JSON.stringify(postContent),
          },
        });
      } else {
        // Subsequent chunks: send as new messages to the chat
        await this.apiClient!.im.message.create({
          params: { receive_id_type: "chat_id" },
          data: {
            receive_id: chatId,
            msg_type: "post",
            content: JSON.stringify(postContent),
          },
        });
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
