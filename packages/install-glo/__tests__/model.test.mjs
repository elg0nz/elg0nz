import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getModel } from "../lib/model.mjs";

describe("getModel", () => {
  it("returns Anthropic model when ANTHROPIC_API_KEY is set", () => {
    const fakeModel = { id: "claude" };
    const createAnthropic = () => () => fakeModel;
    const createOpenAI = () => () => ({ id: "gpt" });

    const result = getModel({
      env: { ANTHROPIC_API_KEY: "sk-ant-test" },
      createAnthropic,
      createOpenAI,
    });

    assert.equal(result.model, fakeModel);
    assert.equal(result.label, "Claude (Anthropic)");
  });

  it("falls back to OpenAI when only OPENAI_API_KEY is set", () => {
    const fakeModel = { id: "gpt" };
    const createAnthropic = () => () => ({ id: "claude" });
    const createOpenAI = () => () => fakeModel;

    const result = getModel({
      env: { OPENAI_API_KEY: "sk-test" },
      createAnthropic,
      createOpenAI,
    });

    assert.equal(result.model, fakeModel);
    assert.equal(result.label, "GPT-4o-mini (OpenAI)");
  });

  it("prefers Anthropic when both keys are set", () => {
    const claudeModel = { id: "claude" };
    const createAnthropic = () => () => claudeModel;
    const createOpenAI = () => () => ({ id: "gpt" });

    const result = getModel({
      env: { ANTHROPIC_API_KEY: "sk-ant-test", OPENAI_API_KEY: "sk-test" },
      createAnthropic,
      createOpenAI,
    });

    assert.equal(result.model, claudeModel);
  });

  it("returns null when no API keys are set", () => {
    const result = getModel({
      env: {},
      createAnthropic: () => () => ({}),
      createOpenAI: () => () => ({}),
    });

    assert.equal(result, null);
  });
});
