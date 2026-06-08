/**
 * Pick an appropriate reaction emoji based on message content.
 * Must be instant (no async/LLM calls) since it's used before processing.
 *
 * Feishu emoji_type reference:
 * https://open.feishu.cn/document/server-docs/im-v1/message-reaction/emojis-introduce
 */

interface EmojiRule {
  patterns: RegExp[];
  emoji: string;
}

// Rules are ordered by specificity: more specific patterns first.
const rules: EmojiRule[] = [
  // Greeting / casual (anchored to start → very specific)
  {
    patterns: [/^(hi|hello|hey|你好|嗨|早|晚上好|下午好)/i],
    emoji: "Wave",
  },
  // Thanks / appreciation
  {
    patterns: [/(谢谢|感谢|thanks|thank you|thx|辛苦|棒|厉害|不错)/i],
    emoji: "Heart",
  },
  // Urgent / ASAP (check early so it isn't swallowed by others)
  {
    patterns: [/(紧急|urgent|asap|赶紧|马上|立刻|immediately)/i],
    emoji: "Zap",
  },
  // Translation
  {
    patterns: [/(翻译|translate|英译中|中译英)/i],
    emoji: "Globe",
  },
  // Search / lookup
  {
    patterns: [/(搜索|搜一下|查一下|查找|look\s?up|search|google|找一下|帮我找)/i],
    emoji: "MagnifyingGlassTiltedRight",
  },
  // Code / programming (before Writing — "写代码" should match Code, not Writing)
  {
    patterns: [/(代码|code|编程|bug|debug|脚本|script|function|函数|程序|typescript|javascript|python)/i],
    emoji: "LaptopComputer",
  },
  // File operations
  {
    patterns: [/(文件|file|读取|read|保存|save|目录|folder|directory)/i],
    emoji: "OpenFileFolder",
  },
  // Math / calculation
  {
    patterns: [/(计算|算一下|calculate|math|统计|数据|data|分析|analyze)/i],
    emoji: "BarChart",
  },
  // Writing / creation (after Code so "写代码" doesn't land here)
  {
    patterns: [/(写|编写|生成|创建|create|write|generate|draft|起草)/i],
    emoji: "Writing",
  },
  // Question / help (broad, keep near the end)
  {
    patterns: [/(怎么|如何|为什么|是什么|什么是|how|why|what|where|when|could you|can you|\?|？)/i],
    emoji: "Thinking",
  },
];

// Default fallback
const DEFAULT_EMOJI = "OnIt";

export function pickReactionEmoji(text: string): string {
  for (const rule of rules) {
    if (rule.patterns.some((p) => p.test(text))) {
      return rule.emoji;
    }
  }
  return DEFAULT_EMOJI;
}
