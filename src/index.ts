import { config } from "./config.js";
import { logger } from "./logger.js";
import { createLLMClient } from "./llm/client.js";
import { createToolRegistry } from "./tools/index.js";
import { JsonStore } from "./memory/json-store.js";
import { Agent } from "./agent/agent.js";
import { CLITransport } from "./transport/cli.js";
import { FeishuBotTransport } from "./transport/feishu-bot.js";
import type { ITransport } from "./transport/types.js";

async function main() {
  const useCLI = process.argv.includes("--cli");

  logger.info({ mode: useCLI ? "cli" : "feishu", model: config.LLM_MODEL_NAME }, "Starting Castor");

  // Initialize components
  const llm = createLLMClient(config);
  const tools = createToolRegistry();
  const store = new JsonStore();
  const agent = new Agent(llm, tools, store);

  // Select transport
  let transport: ITransport;
  if (useCLI) {
    transport = new CLITransport();
  } else {
    transport = new FeishuBotTransport();
  }

  // Start
  await transport.start(async (msg) => {
    return agent.handleMessage(msg.conversationId, msg.text);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down...");
    await transport.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  logger.fatal({ err }, "Fatal error");
  process.exit(1);
});
