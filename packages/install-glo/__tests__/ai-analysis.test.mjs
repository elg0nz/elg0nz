import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzeWithAI, buildPrompt } from "../lib/ai-analysis.mjs";

describe("buildPrompt", () => {
  const baseMetrics = {
    LCP: { value: 3200, display: "3.2 s", score: 0 },
    FCP: { value: 1500, display: "1.5 s", score: 1 },
    performanceScore: 72,
  };

  it("includes target vital and current value", () => {
    const prompt = buildPrompt("LCP", baseMetrics, [], [], 1, []);
    assert.ok(prompt.includes("LCP"));
    assert.ok(prompt.includes("3200ms"));
    assert.ok(prompt.includes("Largest Contentful Paint"));
  });

  it("includes performance score", () => {
    const prompt = buildPrompt("LCP", baseMetrics, [], [], 1, []);
    assert.ok(prompt.includes("72/100"));
  });

  it("includes diagnostics", () => {
    const diags = [
      { title: "Remove unused JS", displayValue: "200 KiB", score: 0.3 },
    ];
    const prompt = buildPrompt("LCP", baseMetrics, diags, [], 1, []);
    assert.ok(prompt.includes("Remove unused JS"));
    assert.ok(prompt.includes("200 KiB"));
  });

  it("includes source file contents", () => {
    const files = [{ path: "app/page.tsx", content: "<Hero />" }];
    const prompt = buildPrompt("LCP", baseMetrics, [], files, 1, []);
    assert.ok(prompt.includes("app/page.tsx"));
    assert.ok(prompt.includes("<Hero />"));
  });

  it("includes previous suggestions context", () => {
    const prev = ["DIAGNOSIS: images not optimized"];
    const prompt = buildPrompt("LCP", baseMetrics, [], [], 2, prev);
    assert.ok(prompt.includes("Previous suggestions already applied"));
    assert.ok(prompt.includes("images not optimized"));
    assert.ok(prompt.includes("Do NOT repeat"));
  });

  it("handles CLS (unitless) correctly", () => {
    const metrics = {
      CLS: { value: 0.25, display: "0.25", score: 0 },
      performanceScore: 60,
    };
    const prompt = buildPrompt("CLS", metrics, [], [], 1, []);
    assert.ok(prompt.includes("0.250"));
    assert.ok(prompt.includes("<0.1"));
  });

  it("handles missing target vital value gracefully", () => {
    const metrics = { performanceScore: 50 };
    const prompt = buildPrompt("LCP", metrics, [], [], 1, []);
    assert.ok(prompt.includes("unknown"));
  });
});

describe("analyzeWithAI", () => {
  it("calls generateText with model and prompt", async () => {
    let capturedArgs;
    const fakeGenerateText = async (args) => {
      capturedArgs = args;
      return { text: "DIAGNOSIS: test response" };
    };

    const fakeModel = { id: "fake-model" };
    const metrics = {
      LCP: { value: 3200, display: "3.2 s", score: 0 },
      performanceScore: 72,
    };

    const result = await analyzeWithAI(
      fakeModel,
      "LCP",
      metrics,
      [],
      [],
      1,
      [],
      { generateText: fakeGenerateText }
    );

    assert.equal(result, "DIAGNOSIS: test response");
    assert.equal(capturedArgs.model, fakeModel);
    assert.ok(capturedArgs.prompt.includes("LCP"));
  });

  it("propagates errors from generateText", async () => {
    const fakeGenerateText = async () => {
      throw new Error("API down");
    };

    await assert.rejects(
      () =>
        analyzeWithAI({}, "LCP", { performanceScore: 0 }, [], [], 1, [], {
          generateText: fakeGenerateText,
        }),
      { message: "API down" }
    );
  });
});
