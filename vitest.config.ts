import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      LLM_API_KEY: "test-key",
      LLM_BASEURL: "https://api.openai.com/v1",
      LLM_MODEL_NAME: "gpt-4o",
      WORKSPACE_DIR: "",
    },
  },
});
