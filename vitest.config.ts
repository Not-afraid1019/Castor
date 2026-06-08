import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      CASTOR_LLM_API_KEY: "test-key",
      CASTOR_LLM_BASEURL: "https://api.openai.com/v1",
      CASTOR_LLM_MODEL_NAME: "gpt-4o",
      CASTOR_WORKSPACE_DIR: "",
    },
  },
});
