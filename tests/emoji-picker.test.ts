import { describe, it, expect } from "vitest";
import { pickReactionEmoji } from "../src/utils/emoji-picker.js";

describe("pickReactionEmoji", () => {
  it("greeting → Wave", () => {
    expect(pickReactionEmoji("你好")).toBe("Wave");
    expect(pickReactionEmoji("Hello!")).toBe("Wave");
  });

  it("thanks → Heart", () => {
    expect(pickReactionEmoji("谢谢你的帮助")).toBe("Heart");
    expect(pickReactionEmoji("Thanks!")).toBe("Heart");
  });

  it("search → MagnifyingGlassTiltedRight", () => {
    expect(pickReactionEmoji("帮我搜索一下天气")).toBe("MagnifyingGlassTiltedRight");
    expect(pickReactionEmoji("search for latest news")).toBe("MagnifyingGlassTiltedRight");
  });

  it("code → LaptopComputer", () => {
    expect(pickReactionEmoji("写一段代码")).toBe("LaptopComputer");
    expect(pickReactionEmoji("help me debug this")).toBe("LaptopComputer");
  });

  it("writing → Writing", () => {
    expect(pickReactionEmoji("帮我写一封邮件")).toBe("Writing");
    expect(pickReactionEmoji("generate a report")).toBe("Writing");
  });

  it("file ops → OpenFileFolder", () => {
    expect(pickReactionEmoji("读取这个文件")).toBe("OpenFileFolder");
  });

  it("calculation → BarChart", () => {
    expect(pickReactionEmoji("帮我计算一下")).toBe("BarChart");
    expect(pickReactionEmoji("分析这组数据")).toBe("BarChart");
  });

  it("translation → Globe", () => {
    expect(pickReactionEmoji("翻译成英文")).toBe("Globe");
  });

  it("question → Thinking", () => {
    expect(pickReactionEmoji("怎么做一个网站？")).toBe("Thinking");
    expect(pickReactionEmoji("what is the weather today?")).toBe("Thinking");
  });

  it("TypeScript question → LaptopComputer (code topic takes priority)", () => {
    expect(pickReactionEmoji("what is TypeScript?")).toBe("LaptopComputer");
  });

  it("urgent → Zap", () => {
    expect(pickReactionEmoji("紧急！马上帮我处理")).toBe("Zap");
  });

  it("fallback → Typing", () => {
    expect(pickReactionEmoji("随便聊聊")).toBe("Typing");
    expect(pickReactionEmoji("ok")).toBe("Typing");
  });
});
