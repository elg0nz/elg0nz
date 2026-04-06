import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { render } from "ink-testing-library";
import { Banner, VitalLine, ScoreDisplay, SuggestionDisplay } from "../lib/display.mjs";

const h = React.createElement;

describe("Banner", () => {
  it("renders the GLO Loop header", () => {
    const { lastFrame } = render(h(Banner));
    const output = lastFrame();
    assert.ok(output.includes("T H E   G L O   L O O P"));
    assert.ok(output.includes("Web Vitals Optimization Engine"));
  });
});

describe("VitalLine", () => {
  it("renders a passing vital with green check", () => {
    const { lastFrame } = render(h(VitalLine, { vitalKey: "LCP", value: 2000 }));
    const output = lastFrame();
    assert.ok(output.includes("LCP"));
    assert.ok(output.includes("2000ms"));
    assert.ok(output.includes("\u2713"));
  });

  it("renders a failing vital with red X", () => {
    const { lastFrame } = render(h(VitalLine, { vitalKey: "LCP", value: 3000 }));
    const output = lastFrame();
    assert.ok(output.includes("LCP"));
    assert.ok(output.includes("3000ms"));
    assert.ok(output.includes("\u2717"));
  });

  it("renders CLS with decimal format", () => {
    const { lastFrame } = render(h(VitalLine, { vitalKey: "CLS", value: 0.05 }));
    const output = lastFrame();
    assert.ok(output.includes("0.050"));
    assert.ok(output.includes("\u2713"));
  });

  it("returns null for unknown vital", () => {
    const { lastFrame } = render(h(VitalLine, { vitalKey: "UNKNOWN", value: 100 }));
    assert.equal(lastFrame(), "");
  });

  it("returns null for undefined value", () => {
    const { lastFrame } = render(h(VitalLine, { vitalKey: "LCP", value: undefined }));
    assert.equal(lastFrame(), "");
  });
});

describe("ScoreDisplay", () => {
  it("renders score value", () => {
    const { lastFrame } = render(h(ScoreDisplay, { score: 95 }));
    const output = lastFrame();
    assert.ok(output.includes("Score"));
    assert.ok(output.includes("95/100"));
  });

  it("renders low score", () => {
    const { lastFrame } = render(h(ScoreDisplay, { score: 30 }));
    const output = lastFrame();
    assert.ok(output.includes("30/100"));
  });
});

describe("SuggestionDisplay", () => {
  it("renders diagnosis lines with labels", () => {
    const suggestion = "DIAGNOSIS: Slow image loading\nFILE: index.html\nLINE: 42\nWHY: Images not optimized";
    const { lastFrame } = render(h(SuggestionDisplay, { suggestion }));
    const output = lastFrame();
    assert.ok(output.includes("DIAGNOSIS:"));
    assert.ok(output.includes("Slow image loading"));
    assert.ok(output.includes("FILE:"));
    assert.ok(output.includes("index.html"));
  });

  it("renders BEFORE/AFTER lines", () => {
    const suggestion = "BEFORE: old code\nAFTER: new code";
    const { lastFrame } = render(h(SuggestionDisplay, { suggestion }));
    const output = lastFrame();
    assert.ok(output.includes("BEFORE:"));
    assert.ok(output.includes("AFTER:"));
  });
});
