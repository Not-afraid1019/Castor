import { describe, it, expect } from "vitest";
import { pickReactionEmoji } from "../src/utils/emoji-picker.js";

describe("pickReactionEmoji", () => {
  it("greeting → SMILE", () => {
    expect(pickReactionEmoji("你好")).toBe("SMILE");
    expect(pickReactionEmoji("Hello!")).toBe("SMILE");
  });

  it("thanks → HEART", () => {
    expect(pickReactionEmoji("谢谢你的帮助")).toBe("HEART");
    expect(pickReactionEmoji("Thanks!")).toBe("HEART");
  });

  it("search → EYES", () => {
    expect(pickReactionEmoji("帮我搜索一下天气")).toBe("EYES");
    expect(pickReactionEmoji("search for latest news")).toBe("EYES");
  });

  it("code → MUSCLE", () => {
    expect(pickReactionEmoji("写一段代码")).toBe("MUSCLE");
    expect(pickReactionEmoji("help me debug this")).toBe("MUSCLE");
  });

  it("writing → MUSCLE", () => {
    expect(pickReactionEmoji("帮我写一封邮件")).toBe("MUSCLE");
    expect(pickReactionEmoji("generate a report")).toBe("MUSCLE");
  });

  it("file ops → OK", () => {
    expect(pickReactionEmoji("读取这个文件")).toBe("OK");
  });

  it("calculation → MUSCLE", () => {
    expect(pickReactionEmoji("帮我计算一下")).toBe("MUSCLE");
    expect(pickReactionEmoji("分析这组数据")).toBe("MUSCLE");
  });

  it("translation → OK", () => {
    expect(pickReactionEmoji("翻译成英文")).toBe("OK");
  });

  it("question → PENSIVEFACE", () => {
    expect(pickReactionEmoji("怎么做一个网站？")).toBe("PENSIVEFACE");
    expect(pickReactionEmoji("what is the weather today?")).toBe("PENSIVEFACE");
  });

  it("urgent → FIRE", () => {
    expect(pickReactionEmoji("紧急！马上帮我处理")).toBe("FIRE");
  });

  it("TypeScript question → MUSCLE (code topic takes priority)", () => {
    expect(pickReactionEmoji("what is TypeScript?")).toBe("MUSCLE");
  });

  it("fallback → Typing", () => {
    expect(pickReactionEmoji("随便聊聊")).toBe("Typing");
    expect(pickReactionEmoji("ok")).toBe("Typing");
  });
});
