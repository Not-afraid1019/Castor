import type { ToolDefinition } from "../llm/types.js";
import type { Tool } from "./types.js";
import { toolToDefinition } from "./types.js";
import { logger } from "../logger.js";

export class ToolRegistry {
  private tools = new Map<string, Tool>();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
    logger.debug({ tool: tool.name }, "Tool registered");
  }

  getDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(toolToDefinition);
  }

  async execute(name: string, args: Record<string, unknown>): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) {
      return `Error: Unknown tool "${name}"`;
    }

    const parsed = tool.parameters.safeParse(args);
    if (!parsed.success) {
      return `Error: Invalid parameters for "${name}": ${parsed.error.message}`;
    }

    try {
      return await tool.execute(parsed.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ tool: name, error: msg }, "Tool execution failed");
      return `Error executing "${name}": ${msg}`;
    }
  }
}
