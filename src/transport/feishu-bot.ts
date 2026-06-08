import * as lark from "@larksuiteoapi/node-sdk";
import type { ITransport, MessageHandler } from "./types.js";
import { config } from "../config.js";
import { logger } from "../logger.js";

export class FeishuBotTransport implements ITransport {
  private wsClient?: lark.WSClient;
  private apiClient?: lark.Client;

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
  }
}
