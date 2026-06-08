import { logger } from "../logger.js";

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const DEFAULTS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  // Network errors
  if (msg.includes("fetch") || msg.includes("econnreset") || msg.includes("timeout")) return true;
  // Rate limit (HTTP 429) or server errors (5xx)
  const status = (err as any).status ?? (err as any).statusCode;
  if (status === 429 || (status >= 500 && status < 600)) return true;
  return false;
}

export async function withRetry<T>(fn: () => Promise<T>, opts?: RetryOptions): Promise<T> {
  const { maxAttempts, baseDelayMs, maxDelayMs } = { ...DEFAULTS, ...opts };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts || !isRetryable(err)) throw err;

      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      logger.warn({ attempt, delay, error: (err as Error).message }, "Retrying LLM call");
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("unreachable");
}
