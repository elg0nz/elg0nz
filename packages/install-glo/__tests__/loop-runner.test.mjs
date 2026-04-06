import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkTarget } from "../lib/loop-runner.mjs";

describe("checkTarget", () => {
  it("returns null when value exceeds threshold", () => {
    const metrics = { LCP: { value: 3000 } };
    const result = checkTarget("LCP", metrics, 1);
    assert.equal(result, null);
  });

  it("returns result when value meets threshold", () => {
    const metrics = { LCP: { value: 2000 } };
    const result = checkTarget("LCP", metrics, 1);
    assert.ok(result);
    assert.equal(result.met, true);
    assert.equal(result.display, "2000ms");
    assert.ok(result.message.includes("already performing well"));
  });

  it("returns loop count message for later loops", () => {
    const metrics = { LCP: { value: 2000 } };
    const result = checkTarget("LCP", metrics, 3);
    assert.ok(result.message.includes("2 optimization loop(s)"));
  });

  it("returns null when value is undefined", () => {
    const metrics = { LCP: { value: undefined } };
    const result = checkTarget("LCP", metrics, 1);
    assert.equal(result, null);
  });

  it("returns null when vital key is missing", () => {
    const metrics = {};
    const result = checkTarget("LCP", metrics, 1);
    assert.equal(result, null);
  });

  it("handles CLS with decimal format", () => {
    const metrics = { CLS: { value: 0.05 } };
    const result = checkTarget("CLS", metrics, 2);
    assert.ok(result);
    assert.equal(result.display, "0.050");
  });

  it("returns null when CLS exceeds threshold", () => {
    const metrics = { CLS: { value: 0.2 } };
    const result = checkTarget("CLS", metrics, 1);
    assert.equal(result, null);
  });

  it("handles exact threshold value", () => {
    const metrics = { LCP: { value: 2500 } };
    const result = checkTarget("LCP", metrics, 1);
    assert.ok(result);
    assert.equal(result.met, true);
  });
});
