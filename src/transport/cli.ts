import * as readline from "node:readline";
import type { ITransport, MessageHandler } from "./types.js";
import { logger } from "../logger.js";

export class CLITransport implements ITransport {
  private rl?: readline.Interface;

  async start(handler: MessageHandler): Promise<void> {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    logger.info("CLI transport started. Type your message (Ctrl+C to exit):");
    console.log("─".repeat(50));

    const prompt = () => {
      this.rl!.question("You: ", async (input) => {
        const text = input.trim();
        if (!text) {
          prompt();
          return;
        }

        try {
          const reply = await handler({
            conversationId: "cli-session",
            text,
            senderId: "cli-user",
          });
          console.log(`\nCastor: ${reply}\n`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`\n[Error] ${msg}\n`);
        }

        prompt();
      });
    };

    prompt();
  }

  async stop(): Promise<void> {
    this.rl?.close();
  }
}
