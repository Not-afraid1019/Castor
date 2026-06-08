import { z } from "zod";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { exec } from "node:child_process";
import { v4 as uuid } from "uuid";
import type { Tool } from "./types.js";
import { config } from "../config.js";
import { getShell, getScriptRunner } from "../utils/platform.js";

const MAX_OUTPUT = 10240;

export const dynamicScriptTool: Tool = {
  name: "dynamic_script",
  description:
    "Write and execute a temporary script. Use this when no existing tool can solve the problem. " +
    "Supports python, node, bash, and powershell.",
  parameters: z.object({
    language: z.enum(["python", "node", "bash", "powershell"]).describe("Script language"),
    code: z.string().describe("Script source code"),
    conversation_id: z.string().optional().describe("Conversation ID for script isolation"),
  }),

  async execute(args) {
    const { language, code, conversation_id } = args as {
      language: string;
      code: string;
      conversation_id?: string;
    };

    const dir = path.join(config.DATA_DIR, "temp-scripts", conversation_id || "global");
    await fs.mkdir(dir, { recursive: true });

    const ext = { python: ".py", node: ".mjs", bash: ".sh", powershell: ".ps1" }[language]!;
    const filename = `script_${uuid().slice(0, 8)}${ext}`;
    const filepath = path.join(dir, filename);

    await fs.writeFile(filepath, code, "utf-8");

    const runner = getScriptRunner(language);
    const command = `${runner} "${filepath}"`;

    return new Promise<string>((resolve) => {
      const child = exec(command, {
        shell: getShell(),
        cwd: dir,
        timeout: config.SCRIPT_TIMEOUT,
        maxBuffer: 1024 * 1024,
      });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (d) => { stdout += d; });
      child.stderr?.on("data", (d) => { stderr += d; });

      child.on("close", (code) => {
        let output = "";
        if (stdout) output += stdout;
        if (stderr) output += (output ? "\n[stderr]\n" : "") + stderr;
        if (!output) output = `(no output, exit code: ${code})`;
        if (output.length > MAX_OUTPUT) {
          output = output.slice(0, MAX_OUTPUT) + "\n...[truncated]";
        }
        resolve(code === 0 ? output : `[exit code: ${code}]\n${output}`);
      });

      child.on("error", (err) => {
        resolve(`Error: ${err.message}`);
      });
    });
  },
};
