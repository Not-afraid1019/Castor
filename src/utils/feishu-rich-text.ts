/**
 * Convert markdown text to Feishu post (rich text) format.
 * Supports: code blocks, bold, inline code, links, and plain text paragraphs.
 *
 * Feishu post format:
 * { zh_cn: { title: "", content: [[...elements], [...elements]] } }
 */

type PostElement =
  | { tag: "text"; text: string; style?: string[] }
  | { tag: "a"; text: string; href: string }
  | { tag: "code_block"; language: string; text: string };

type PostLine = PostElement[];

interface FeishuPost {
  zh_cn: {
    title: string;
    content: PostLine[];
  };
}

export function markdownToFeishuPost(markdown: string): FeishuPost {
  const lines: PostLine[] = [];
  const rawLines = markdown.split("\n");
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];

    // Code block: ```lang ... ```
    const codeStart = line.match(/^```(\w*)/);
    if (codeStart) {
      const language = codeStart[1] || "text";
      const codeLines: string[] = [];
      i++;
      while (i < rawLines.length && !rawLines[i].startsWith("```")) {
        codeLines.push(rawLines[i]);
        i++;
      }
      i++; // skip closing ```
      lines.push([{ tag: "code_block", language, text: codeLines.join("\n") }]);
      continue;
    }

    // Empty line → empty paragraph
    if (line.trim() === "") {
      lines.push([{ tag: "text", text: "" }]);
      i++;
      continue;
    }

    // Heading → bold text
    const heading = line.match(/^(#{1,6})\s+(.+)/);
    if (heading) {
      lines.push([{ tag: "text", text: heading[2], style: ["bold"] }]);
      i++;
      continue;
    }

    // Regular line → parse inline formatting
    lines.push(parseInline(line));
    i++;
  }

  return { zh_cn: { title: "", content: lines } };
}

function parseInline(text: string): PostLine {
  const elements: PostLine = [];
  // Match: **bold**, `code`, [text](url), or plain text
  const regex = /(\*\*(.+?)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Add plain text before this match
    if (match.index > lastIndex) {
      elements.push({ tag: "text", text: text.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      // **bold**
      elements.push({ tag: "text", text: match[2], style: ["bold"] });
    } else if (match[3]) {
      // `inline code` — render as bold since Feishu post doesn't have inline code tag
      elements.push({ tag: "text", text: match[4], style: ["bold"] });
    } else if (match[5]) {
      // [text](url)
      elements.push({ tag: "a", text: match[6], href: match[7] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining plain text
  if (lastIndex < text.length) {
    elements.push({ tag: "text", text: text.slice(lastIndex) });
  }

  if (elements.length === 0) {
    elements.push({ tag: "text", text });
  }

  return elements;
}
