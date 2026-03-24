import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VITALS } from "../lib/vitals.mjs";

describe("VITALS", () => {
  it("has all six core web vitals", () => {
    const keys = Object.keys(VITALS);
    assert.deepStrictEqual(keys, ["LCP", "FCP", "CLS", "TBT", "SI", "TTFB"]);
  });

  it("each vital has required fields", () => {
    for (const [key, info] of Object.entries(VITALS)) {
      assert.ok(typeof info.good === "number", `${key}.good should be a number`);
      assert.ok(typeof info.unit === "string", `${key}.unit should be a string`);
      assert.ok(typeof info.name === "string", `${key}.name should be a string`);
      assert.ok(typeof info.audit === "string", `${key}.audit should be a string`);
    }
  });

  it("CLS threshold is sub-1 (unitless)", () => {
    assert.equal(VITALS.CLS.unit, "");
    assert.ok(VITALS.CLS.good < 1);
  });
});
