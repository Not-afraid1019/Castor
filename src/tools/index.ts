import { ToolRegistry } from "./registry.js";
import { fileOpsTool } from "./file-ops.js";
import { scriptExecTool } from "./script-exec.js";
import { webSearchTool } from "./web-search.js";
import { dynamicScriptTool } from "./dynamic-script.js";

export function createToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register(fileOpsTool);
  registry.register(scriptExecTool);
  registry.register(webSearchTool);
  registry.register(dynamicScriptTool);
  return registry;
}

export { ToolRegistry } from "./registry.js";
