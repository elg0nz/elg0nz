import { execSync as defaultExecSync } from "node:child_process";
import { VITALS } from "./vitals.mjs";

export function checkLighthouse({ execSync = defaultExecSync } = {}) {
  try {
    execSync("npx -y lighthouse --version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export function runLighthouse(url, { execSync = defaultExecSync } = {}) {
  const cmd = [
    "npx -y lighthouse",
    `"${url}"`,
    "--output=json",
    '--chrome-flags="--headless --no-sandbox"',
    "--only-categories=performance",
    "--quiet",
  ].join(" ");

  const result = execSync(cmd, {
    maxBuffer: 100 * 1024 * 1024,
    stdio: ["pipe", "pipe", "pipe"],
  });
  return JSON.parse(result.toString());
}

export function extractMetrics(report) {
  const metrics = {};
  for (const [key, info] of Object.entries(VITALS)) {
    const audit = report.audits?.[info.audit];
    if (audit) {
      metrics[key] = {
        value: audit.numericValue,
        display: audit.displayValue,
        score: audit.score,
      };
    }
  }
  metrics.performanceScore = Math.round(
    (report.categories?.performance?.score || 0) * 100
  );
  return metrics;
}

export function extractDiagnostics(report) {
  const relevant = [
    "render-blocking-resources",
    "unused-css-rules",
    "unused-javascript",
    "modern-image-formats",
    "uses-optimized-images",
    "uses-responsive-images",
    "offscreen-images",
    "unminified-css",
    "unminified-javascript",
    "dom-size",
    "critical-request-chains",
    "largest-contentful-paint-element",
    "layout-shift-elements",
    "long-tasks",
    "mainthread-work-breakdown",
    "bootup-time",
    "font-display",
    "uses-text-compression",
    "duplicated-javascript",
    "legacy-javascript",
    "total-byte-weight",
  ];

  const issues = [];
  for (const id of relevant) {
    const audit = report.audits?.[id];
    if (audit && audit.score !== null && audit.score < 1) {
      issues.push({
        id,
        title: audit.title,
        displayValue: audit.displayValue || "",
        score: audit.score,
      });
    }
  }
  return issues.sort((a, b) => a.score - b.score);
}
