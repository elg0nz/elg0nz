import { createAnthropic as defaultCreateAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI as defaultCreateOpenAI } from "@ai-sdk/openai";

export function getModel({
  env = process.env,
  createAnthropic = defaultCreateAnthropic,
  createOpenAI = defaultCreateOpenAI,
} = {}) {
  if (env.ANTHROPIC_API_KEY) {
    const anthropic = createAnthropic();
    return {
      model: anthropic("claude-sonnet-4-20250514"),
      label: "Claude (Anthropic)",
    };
  }
  if (env.OPENAI_API_KEY) {
    const openai = createOpenAI();
    return { model: openai("gpt-4o-mini"), label: "GPT-4o-mini (OpenAI)" };
  }
  return null;
}
