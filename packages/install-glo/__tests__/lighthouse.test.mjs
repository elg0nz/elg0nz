import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  checkLighthouse,
  runLighthouse,
  extractMetrics,
  extractDiagnostics,
} from "../lib/lighthouse.mjs";

// ── Fixtures ──────────────────────────────────────────────────────────

function makeLighthouseReport({
  perfScore = 0.72,
  lcp = 3200,
  fcp = 1500,
  cls = 0.05,
  tbt = 300,
  si = 4000,
  ttfb = 600,
  diagnostics = {},
} = {}) {
  return {
    categories: { performance: { score: perfScore } },
    audits: {
      "largest-contentful-paint": {
        numericValue: lcp,
        displayValue: `${(lcp / 1000).toFixed(1)} s`,
        score: lcp <= 2500 ? 1 : 0,
      },
      "first-contentful-paint": {
        numericValue: fcp,
        displayValue: `${(fcp / 1000).toFixed(1)} s`,
        score: fcp <= 1800 ? 1 : 0,
      },
      "cumulative-layout-shift": {
        numericValue: cls,
        displayValue: cls.toFixed(3),
        score: cls <= 0.1 ? 1 : 0,
      },
      "total-blocking-time": {
        numericValue: tbt,
        displayValue: `${tbt} ms`,
        score: tbt <= 200 ? 1 : 0,
      },
      "speed-index": {
        numericValue: si,
        displayValue: `${(si / 1000).toFixed(1)} s`,
        score: si <= 3400 ? 1 : 0,
      },
      "server-response-time": {
        numericValue: ttfb,
        displayValue: `${ttfb} ms`,
        score: ttfb <= 800 ? 1 : 0,
      },
      ...diagnostics,
    },
  };
}

// ── checkLighthouse ───────────────────────────────────────────────────

describe("checkLighthouse", () => {
  it("returns true when lighthouse is available", () => {
    const execSync = () => "10.0.0";
    assert.equal(checkLighthouse({ execSync }), true);
  });

  it("returns false when lighthouse throws", () => {
    const execSync = () => {
      throw new Error("not found");
    };
    assert.equal(checkLighthouse({ execSync }), false);
  });
});

// ── runLighthouse ─────────────────────────────────────────────────────

describe("runLighthouse", () => {
  it("parses JSON output from execSync", () => {
    const fakeReport = { categories: {}, audits: {} };
    const execSync = () => Buffer.from(JSON.stringify(fakeReport));
    const result = runLighthouse("http://localhost:3000", { execSync });
    assert.deepStrictEqual(result, fakeReport);
  });

  it("passes the URL into the command", () => {
    let capturedCmd;
    const execSync = (cmd) => {
      capturedCmd = cmd;
      return Buffer.from("{}");
    };
    runLighthouse("http://example.com", { execSync });
    assert.ok(capturedCmd.includes('"http://example.com"'));
  });

  it("throws on invalid JSON", () => {
    const execSync = () => Buffer.from("not json");
    assert.throws(() => runLighthouse("http://localhost:3000", { execSync }));
  });
});

// ── extractMetrics ────────────────────────────────────────────────────

describe("extractMetrics", () => {
  it("extracts all six vitals from a report", () => {
    const report = makeLighthouseReport();
    const metrics = extractMetrics(report);

    assert.equal(metrics.LCP.value, 3200);
    assert.equal(metrics.FCP.value, 1500);
    assert.equal(metrics.CLS.value, 0.05);
    assert.equal(metrics.TBT.value, 300);
    assert.equal(metrics.SI.value, 4000);
    assert.equal(metrics.TTFB.value, 600);
  });

  it("computes performanceScore as percentage", () => {
    const report = makeLighthouseReport({ perfScore: 0.85 });
    const metrics = extractMetrics(report);
    assert.equal(metrics.performanceScore, 85);
  });

  it("defaults performanceScore to 0 when missing", () => {
    const report = { audits: {}, categories: {} };
    const metrics = extractMetrics(report);
    assert.equal(metrics.performanceScore, 0);
  });

  it("skips audits that are missing", () => {
    const report = { audits: {}, categories: { performance: { score: 0.5 } } };
    const metrics = extractMetrics(report);
    assert.equal(metrics.LCP, undefined);
    assert.equal(metrics.performanceScore, 50);
  });
});

// ── extractDiagnostics ────────────────────────────────────────────────

describe("extractDiagnostics", () => {
  it("returns failing audits sorted worst-first", () => {
    const report = makeLighthouseReport({
      diagnostics: {
        "unused-javascript": {
          title: "Remove unused JavaScript",
          displayValue: "200 KiB",
          score: 0.3,
        },
        "render-blocking-resources": {
          title: "Eliminate render-blocking resources",
          displayValue: "1,200 ms",
          score: 0.1,
        },
      },
    });
    const diags = extractDiagnostics(report);
    assert.ok(diags.length >= 2);
    assert.equal(diags[0].id, "render-blocking-resources");
    assert.equal(diags[1].id, "unused-javascript");
  });

  it("excludes audits with score === 1 (passing)", () => {
    const report = makeLighthouseReport({
      diagnostics: {
        "dom-size": { title: "DOM size", score: 1, displayValue: "" },
      },
    });
    const diags = extractDiagnostics(report);
    const domSize = diags.find((d) => d.id === "dom-size");
    assert.equal(domSize, undefined);
  });

  it("excludes audits with score === null", () => {
    const report = makeLighthouseReport({
      diagnostics: {
        "font-display": {
          title: "Font display",
          score: null,
          displayValue: "",
        },
      },
    });
    const diags = extractDiagnostics(report);
    const fontDisplay = diags.find((d) => d.id === "font-display");
    assert.equal(fontDisplay, undefined);
  });

  it("returns empty array for clean report", () => {
    const report = { audits: {} };
    const diags = extractDiagnostics(report);
    assert.deepStrictEqual(diags, []);
  });
});
