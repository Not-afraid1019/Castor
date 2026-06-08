import { z } from "zod";
import { exec } from "node:child_process";
import type { Tool } from "./types.js";
import { config } from "../config.js";
import { getShell } from "../utils/platform.js";

const MAX_OUTPUT = 10240;

export const scriptExecTool: Tool = {
  name: "script_exec",
  description: "Execute a shell command and return its output. Timeout enforced.",
  parameters: z.object({
    command: z.string().describe("Shell command to execute"),
    cwd: z.string().optional().describe("Working directory (defaults to project root)"),
  }),

  async execute(args) {
    const { command, cwd } = args as { command: string; cwd?: string };
    const shell = getShell();

    return new Promise<string>((resolve) => {
      const child = exec(command, {
        shell,
        cwd: cwd || process.cwd(),
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
