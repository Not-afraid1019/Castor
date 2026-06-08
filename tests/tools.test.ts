import { describe, it, expect } from "vitest";
import { createToolRegistry } from "../src/tools/index.js";

describe("ToolRegistry", () => {
  const registry = createToolRegistry();

  it("should register 4 built-in tools", () => {
    const defs = registry.getDefinitions();
    expect(defs).toHaveLength(4);
    const names = defs.map((d) => d.name);
    expect(names).toContain("file_ops");
    expect(names).toContain("script_exec");
    expect(names).toContain("web_search");
    expect(names).toContain("dynamic_script");
  });

  it("should return error for unknown tool", async () => {
    const result = await registry.execute("nonexistent", {});
    expect(result).toContain("Unknown tool");
  });

  it("should validate parameters", async () => {
    const result = await registry.execute("file_ops", {});
    expect(result).toContain("Invalid parameters");
  });

  it("should execute file_ops list", async () => {
    const result = await registry.execute("file_ops", { action: "list", path: "." });
    expect(result).toContain("src");
  });

  it("should execute script_exec", async () => {
    const result = await registry.execute("script_exec", { command: "echo hello" });
    expect(result.trim()).toBe("hello");
  });
});
