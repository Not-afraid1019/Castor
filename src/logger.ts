import pino from "pino";
import * as fs from "node:fs";
import * as path from "node:path";

const LOG_DIR = process.env.DATA_DIR || "./data";
const LOG_FILE = path.join(LOG_DIR, "castor.log");
const MAX_LINES = 20000;
const TRIM_TO = 10000;

// Ensure log directory exists
fs.mkdirSync(LOG_DIR, { recursive: true });

// Rotate log file if it exceeds MAX_LINES
rotateIfNeeded();

// Dual output: pretty console + file
const transport = pino.transport({
  targets: [
    {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "SYS:HH:MM:ss" },
      level: process.env.LOG_LEVEL || "info",
    },
    {
      target: "pino/file",
      options: { destination: LOG_FILE, mkdir: true, append: true },
      level: "debug", // File always captures debug level
    },
  ],
});

export const logger = pino({ level: "debug" }, transport);

/**
 * If the log file exceeds MAX_LINES, keep only the last TRIM_TO lines.
 */
function rotateIfNeeded(): void {
  try {
    if (!fs.existsSync(LOG_FILE)) return;

    const content = fs.readFileSync(LOG_FILE, "utf-8");
    const lines = content.split("\n");

    if (lines.length > MAX_LINES) {
      const trimmed = lines.slice(-TRIM_TO).join("\n");
      fs.writeFileSync(LOG_FILE, trimmed, "utf-8");
    }
  } catch {
    // Non-critical, skip silently
  }
}
