import type { AIProvider } from "./types";
import { MockProvider } from "./mock";
import { OpenAICompatProvider } from "./openai-compat";

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const provider = process.env.AI_PROVIDER ?? "mock";
  if (
    provider === "openai-compat" &&
    process.env.AI_BASE_URL &&
    process.env.AI_API_KEY &&
    process.env.AI_MODEL
  ) {
    cached = new OpenAICompatProvider(
      process.env.AI_BASE_URL,
      process.env.AI_API_KEY,
      process.env.AI_MODEL
    );
  } else {
    cached = new MockProvider();
  }
  return cached;
}

export * from "./types";
