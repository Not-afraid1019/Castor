export interface IncomingMessage {
  conversationId: string;
  text: string;
  senderId: string;
}

export type MessageHandler = (msg: IncomingMessage) => Promise<string>;

export interface ITransport {
  start(handler: MessageHandler): Promise<void>;
  stop(): Promise<void>;
}
