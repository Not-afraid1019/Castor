import { z } from "zod";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { glob } from "glob";
import type { Tool } from "./types.js";
import { checkPathAccess } from "../utils/path-guard.js";

export const fileOpsTool: Tool = {
  name: "file_ops",
  description:
    "File operations: read, write, list, or search files. Use action to specify the operation. " +
    "If a path is outside the workspace, the tool will ask for user confirmation — " +
    "retry with force: true after the user agrees.",
  parameters: z.object({
    action: z.enum(["read", "write", "list", "search"]).describe("Operation to perform"),
    path: z.string().describe("File or directory path"),
    content: z.string().optional().describe("Content to write (for write action)"),
    pattern: z.string().optional().describe("Glob pattern (for search action)"),
    force: z.boolean().optional().describe("Set to true to bypass workspace restriction after user confirms"),
  }),

  async execute(args) {
    const { action, path: targetPath, content, pattern, force } = args as {
      action: string;
      path: string;
      content?: string;
      pattern?: string;
      force?: boolean;
    };

    // Path access control
    if (!force) {
      const access = checkPathAccess(targetPath);
      if (!access.allowed) {
        return access.message;
      }
    }

    switch (action) {
      case "read": {
        const data = await fs.readFile(targetPath, "utf-8");
        const MAX = 10240;
        return data.length > MAX ? data.slice(0, MAX) + "\n...[truncated]" : data;
      }
      case "write": {
        if (!content) return "Error: content is required for write action";
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.writeFile(targetPath, content, "utf-8");
        return `File written: ${targetPath}`;
      }
      case "list": {
        const entries = await fs.readdir(targetPath, { withFileTypes: true });
        return entries
          .map((e) => `${e.isDirectory() ? "[dir]" : "[file]"} ${e.name}`)
          .join("\n");
      }
      case "search": {
        const searchPattern = pattern || "**/*";
        const files = await glob(searchPattern, { cwd: targetPath, nodir: true });
        return files.length
          ? files.slice(0, 50).join("\n") + (files.length > 50 ? `\n...and ${files.length - 50} more` : "")
          : "No files found";
      }
      default:
        return `Error: Unknown action "${action}"`;
    }
  },
};
