/**
 * Split a long message into chunks that fit Feishu's message size limit.
 * Tries to break at paragraph boundaries.
 */
const MAX_CHUNK_LENGTH = 4000; // Feishu limit is ~30KB, but keep it readable

export function splitMessage(text: string): string[] {
  if (text.length <= MAX_CHUNK_LENGTH) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= MAX_CHUNK_LENGTH) {
      chunks.push(remaining);
      break;
    }

    // Find a good break point
    let breakAt = findBreakPoint(remaining, MAX_CHUNK_LENGTH);
    chunks.push(remaining.slice(0, breakAt).trimEnd());
    remaining = remaining.slice(breakAt).trimStart();
  }

  return chunks;
}

function findBreakPoint(text: string, maxLen: number): number {
  const slice = text.slice(0, maxLen);

  // Try to break at double newline (paragraph boundary)
  const doubleNL = slice.lastIndexOf("\n\n");
  if (doubleNL > maxLen * 0.3) return doubleNL + 2;

  // Try single newline
  const singleNL = slice.lastIndexOf("\n");
  if (singleNL > maxLen * 0.3) return singleNL + 1;

  // Try space
  const space = slice.lastIndexOf(" ");
  if (space > maxLen * 0.3) return space + 1;

  // Hard break
  return maxLen;
}
