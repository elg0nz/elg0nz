#!/usr/bin/env node

import { createInterface } from "node:readline/promises";
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import chalk from "chalk";

// ── Provider ───────────────────────────────────────────────────────────

function getModel() {
  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = createAnthropic();
    return {
      model: anthropic("claude-sonnet-4-20250514"),
      label: "Claude (Anthropic)",
    };
  }
  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI();
    return { model: openai("gpt-4o-mini"), label: "GPT-4o-mini (OpenAI)" };
  }
  return null;
}

// ── Web Vitals ─────────────────────────────────────────────────────────

const VITALS = {
  LCP: {
    good: 2500,
    unit: "ms",
    name: "Largest Contentful Paint",
    audit: "largest-contentful-paint",
  },
  FCP: {
    good: 1800,
    unit: "ms",
    name: "First Contentful Paint",
    audit: "first-contentful-paint",
  },
  CLS: {
    good: 0.1,
    unit: "",
    name: "Cumulative Layout Shift",
    audit: "cumulative-layout-shift",
  },
  TBT: {
    good: 200,
    unit: "ms",
    name: "Total Blocking Time",
    audit: "total-blocking-time",
  },
  SI: {
    good: 3400,
    unit: "ms",
    name: "Speed Index",
    audit: "speed-index",
  },
  TTFB: {
    good: 800,
    unit: "ms",
    name: "Time to First Byte",
    audit: "server-response-time",
  },
};

// ── Lighthouse ─────────────────────────────────────────────────────────

function checkLighthouse() {
  try {
    execSync("npx -y lighthouse --version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function runLighthouse(url) {
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

function extractMetrics(report) {
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

function extractDiagnostics(report) {
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
  return issues.sort((a, b) => a.score - b.score); // worst first
}

// ── Source File Discovery ──────────────────────────────────────────────

function discoverPageFiles(projectRoot, route) {
  const routePath = route === "/" ? "" : route.replace(/^\//, "");
  const files = [];

  const candidates = [
    // Next.js App Router
    join("app", routePath, "page.tsx"),
    join("app", routePath, "page.jsx"),
    join("app", routePath, "page.js"),
    join("app", routePath, "layout.tsx"),
    join("app", routePath, "layout.jsx"),
    join("app", "layout.tsx"),
    join("app", "layout.jsx"),
    // src/app
    join("src", "app", routePath, "page.tsx"),
    join("src", "app", routePath, "layout.tsx"),
    join("src", "app", "layout.tsx"),
    // Next.js Pages Router
    join("pages", routePath + ".tsx"),
    join("pages", routePath + ".jsx"),
    join("pages", routePath, "index.tsx"),
    join("pages", routePath, "index.jsx"),
    // Config files relevant to performance
    "next.config.ts",
    "next.config.js",
    "next.config.mjs",
    "vite.config.ts",
    "vite.config.js",
  ];

  for (const rel of candidates) {
    const full = join(projectRoot, rel);
    if (existsSync(full)) {
      try {
        const content = readFileSync(full, "utf8");
        if (content.length < 15000) {
          files.push({ path: rel, content });
        } else {
          files.push({
            path: rel,
            content: content.slice(0, 15000) + "\n// ... truncated",
          });
        }
      } catch {}
    }
  }

  // Scan for component imports from the page file
  if (files.length > 0) {
    const pageFile = files[0];
    const importRegex = /from\s+["']([./][^"']+)["']/g;
    let match;
    while ((match = importRegex.exec(pageFile.content)) !== null) {
      const importPath = match[1];
      const possiblePaths = [
        importPath + ".tsx",
        importPath + ".jsx",
        importPath + ".ts",
        importPath + ".js",
        join(importPath, "index.tsx"),
      ];
      for (const p of possiblePaths) {
        const resolved = join(
          projectRoot,
          files[0].path.replace(/[^/]+$/, ""),
          p
        );
        if (existsSync(resolved)) {
          try {
            const content = readFileSync(resolved, "utf8");
            const relPath = relative(projectRoot, resolved);
            if (!files.find((f) => f.path === relPath)) {
              files.push({
                path: relPath,
                content:
                  content.length > 8000
                    ? content.slice(0, 8000) + "\n// ... truncated"
                    : content,
              });
            }
          } catch {}
          break;
        }
      }
    }
  }

  return files;
}

// ── Display Helpers ────────────────────────────────────────────────────

function formatVital(key, value) {
  const info = VITALS[key];
  if (!info || value === undefined || value === null) return null;
  const passed = key === "CLS" ? value <= info.good : value <= info.good;
  const formatted =
    info.unit === "ms" ? `${Math.round(value)}ms` : value.toFixed(3);
  const icon = passed ? chalk.green("✓") : chalk.red("✗");
  const color = passed ? chalk.green : chalk.red;
  return (
    `    ${chalk.white(key.padEnd(6))}` +
    `${color(formatted.padStart(9))}` +
    `  ${chalk.dim(`(good: <${info.good}${info.unit})`)} ${icon}`
  );
}

function printBanner() {
  const lines = [
    "",
    chalk.hex("#FF8C00").bold(
      "  ┌─────────────────────────────────────────────────────┐"
    ),
    chalk.hex("#FF8C00").bold("  │") +
      chalk.hex("#FF8C00").bold(
        "             T H E   G L O   L O O P                "
      ) +
      chalk.hex("#FF8C00").bold("│"),
    chalk.hex("#FF8C00").bold("  │") +
      chalk.dim(
        "   Web Vitals Optimization Engine                    "
      ) +
      chalk.hex("#FF8C00").bold("│"),
    chalk.hex("#FF8C00").bold("  │") +
      chalk.dim(
        "                                                     "
      ) +
      chalk.hex("#FF8C00").bold("│"),
    chalk.hex("#FF8C00").bold("  │") +
      chalk.hex("#4AF626")("    G") +
      chalk.white("ather    → ") +
      chalk.dim("run Lighthouse, extract metrics    ") +
      chalk.hex("#FF8C00").bold("│"),
    chalk.hex("#FF8C00").bold("  │") +
      chalk.hex("#4AF626")("    L") +
      chalk.white("everage  → ") +
      chalk.dim("AI analyzes code + diagnostics    ") +
      chalk.hex("#FF8C00").bold("│"),
    chalk.hex("#FF8C00").bold("  │") +
      chalk.hex("#4AF626")("    O") +
      chalk.white("perate   → ") +
      chalk.dim("apply fix, re-measure, repeat     ") +
      chalk.hex("#FF8C00").bold("│"),
    chalk.hex("#FF8C00").bold("  │") +
      chalk.dim(
        "                                                     "
      ) +
      chalk.hex("#FF8C00").bold("│"),
    chalk.hex("#FF8C00").bold("  │") +
      chalk.dim("    ↻ repeat until target met") +
      chalk.dim(
        "                         "
      ) +
      chalk.hex("#FF8C00").bold("│"),
    chalk.hex("#FF8C00").bold(
      "  └─────────────────────────────────────────────────────┘"
    ),
    "",
  ];
  console.log(lines.join("\n"));
}

// ── AI Analysis ────────────────────────────────────────────────────────

async function analyzeWithAI(
  model,
  targetVital,
  metrics,
  diagnostics,
  sourceFiles,
  loopNumber,
  previousSuggestions
) {
  const vitalInfo = VITALS[targetVital];

  const sourceContext = sourceFiles
    .map((f) => `--- ${f.path} ---\n${f.content}`)
    .join("\n\n");

  const diagText = diagnostics
    .slice(0, 10)
    .map(
      (d) =>
        `- ${d.title}${d.displayValue ? ` (${d.displayValue})` : ""} [score: ${d.score}]`
    )
    .join("\n");

  const metricsText = Object.entries(metrics)
    .filter(([k]) => k !== "performanceScore")
    .map(([k, v]) => {
      const info = VITALS[k];
      if (!info) return null;
      const val = info.unit === "ms" ? `${Math.round(v.value)}ms` : v.value?.toFixed(3);
      const status = v.value <= info.good ? "PASS" : "FAIL";
      return `  ${k}: ${val} (good: <${info.good}${info.unit}) [${status}]`;
    })
    .filter(Boolean)
    .join("\n");

  const prevContext =
    previousSuggestions.length > 0
      ? `\n\nPrevious suggestions already applied:\n${previousSuggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nDo NOT repeat these. Find the NEXT optimization.`
      : "";

  const prompt = `You are a frontend infrastructure engineer optimizing web performance.

## Current Metrics (Loop ${loopNumber})
Performance Score: ${metrics.performanceScore}/100
${metricsText}

## Target
Optimize ${targetVital} (${vitalInfo.name}): currently ${metrics[targetVital]?.value !== undefined ? (vitalInfo.unit === "ms" ? Math.round(metrics[targetVital].value) + "ms" : metrics[targetVital].value.toFixed(3)) : "unknown"}, target: <${vitalInfo.good}${vitalInfo.unit}

## Lighthouse Diagnostics (sorted by severity)
${diagText || "No failing diagnostics."}

## Source Files
${sourceContext || "No source files found for this route."}
${prevContext}

## Instructions

Respond in EXACTLY this format (no markdown fences):

DIAGNOSIS: One sentence explaining what is causing the ${targetVital} issue.

FILE: path/to/file.ext
LINE: approximate line number (or "new" if adding to config)

BEFORE:
<exact code to replace, or "N/A" if adding new code>

AFTER:
<optimized code>

WHY: One sentence on expected impact with estimated improvement in ${vitalInfo.unit || "score"}.

Keep the fix SURGICAL — one change per loop. Prefer high-impact, low-risk changes:
- Image optimization (priority, sizes, lazy/eager, format)
- Font loading (display: swap, preload, subset)
- Bundle optimization (dynamic imports, tree shaking)
- Render-blocking resources (async, defer, preload)
- Layout shift prevention (explicit dimensions, aspect-ratio)
- Server response (caching, compression, CDN)
- Component-level code splitting`;

  const result = await generateText({
    model,
    prompt,
  });

  return result.text;
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  printBanner();

  const resolved = getModel();
  if (!resolved) {
    console.log(chalk.white("  Set an API key to power the AI analysis:\n"));
    console.log(
      chalk.hex("#4AF626")("    export ANTHROPIC_API_KEY=sk-ant-...") +
        chalk.dim("  (recommended)")
    );
    console.log(chalk.hex("#4AF626")("    export OPENAI_API_KEY=sk-..."));
    console.log(
      chalk.dim("\n  Then run: ") +
        chalk.white("npm run glo-loop") +
        "\n"
    );
    process.exit(1);
  }

  const { model, label } = resolved;
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log(chalk.dim(`  AI: ${label} via Vercel AI SDK\n`));

  // ── Collect inputs ────────────────────────────────────────────────

  const url = await rl.question(
    chalk.hex("#FF8C00")("  Page URL ") +
      chalk.dim("(default: http://localhost:3000): ")
  );
  const targetUrl = url.trim() || "http://localhost:3000";

  // Extract route from URL for source file discovery
  let route = "/";
  try {
    const parsed = new URL(targetUrl);
    route = parsed.pathname;
  } catch {}

  console.log("");
  console.log(chalk.white("  Available web vitals:"));
  for (const [key, info] of Object.entries(VITALS)) {
    console.log(
      chalk.hex("#4AF626")(`    ${key.padEnd(6)}`) +
        chalk.dim(`${info.name} (good: <${info.good}${info.unit})`)
    );
  }
  console.log("");

  const vitalInput = await rl.question(
    chalk.hex("#FF8C00")("  Target vital ") + chalk.dim("(default: LCP): ")
  );
  const targetVital = (vitalInput.trim().toUpperCase() || "LCP");
  if (!VITALS[targetVital]) {
    console.log(chalk.red(`\n  Unknown vital: ${targetVital}`));
    console.log(chalk.dim(`  Choose from: ${Object.keys(VITALS).join(", ")}\n`));
    rl.close();
    process.exit(1);
  }

  const maxInput = await rl.question(
    chalk.hex("#FF8C00")("  Max loops ") + chalk.dim("(default: 10): ")
  );
  const maxLoops = parseInt(maxInput.trim(), 10) || 10;

  console.log("");
  console.log(
    chalk.hex("#FF8C00")("  Target: ") +
      chalk.white(
        `${targetVital} < ${VITALS[targetVital].good}${VITALS[targetVital].unit}`
      ) +
      chalk.dim(` on ${targetUrl}`)
  );
  console.log(
    chalk.hex("#FF8C00")("  Loops:  ") + chalk.white(`${maxLoops} max`)
  );

  // Discover source files
  const projectRoot = process.env.INIT_CWD || process.cwd();
  const sourceFiles = discoverPageFiles(projectRoot, route);
  if (sourceFiles.length > 0) {
    console.log(
      chalk.hex("#FF8C00")("  Files:  ") +
        chalk.dim(sourceFiles.map((f) => f.path).join(", "))
    );
  }

  const previousSuggestions = [];

  // ── The Loop ────────────────────────────────────────────────────

  for (let loop = 1; loop <= maxLoops; loop++) {
    console.log(
      chalk.hex("#FF8C00")(
        `\n  ── Loop ${loop}/${maxLoops} ${"─".repeat(42)}`
      )
    );

    // ── GATHER ──────────────────────────────────────────────────

    console.log(chalk.hex("#4AF626").bold("\n  GATHER"));
    console.log(chalk.dim("  Running Lighthouse...\n"));

    let report, metrics, diagnostics;
    try {
      report = runLighthouse(targetUrl);
      metrics = extractMetrics(report);
      diagnostics = extractDiagnostics(report);
    } catch (err) {
      console.log(chalk.red(`  Lighthouse failed: ${err.message}`));
      console.log(chalk.dim("  Is the page running? Is Chrome installed?\n"));
      const retry = await rl.question(
        chalk.hex("#FF8C00")("  Retry? ") + chalk.dim("[y/n]: ")
      );
      if (retry.trim().toLowerCase() === "y") {
        loop--;
        continue;
      }
      break;
    }

    console.log(
      chalk.white(`    Score   `) +
        chalk.bold(
          metrics.performanceScore >= 90
            ? chalk.green(`${metrics.performanceScore}/100`)
            : metrics.performanceScore >= 50
              ? chalk.yellow(`${metrics.performanceScore}/100`)
              : chalk.red(`${metrics.performanceScore}/100`)
        )
    );

    for (const key of Object.keys(VITALS)) {
      const line = formatVital(key, metrics[key]?.value);
      if (line) console.log(line);
    }

    // Check if target is already met
    const currentValue = metrics[targetVital]?.value;
    if (currentValue !== undefined && currentValue <= VITALS[targetVital].good) {
      console.log(
        chalk.green.bold(
          `\n  Target met! ${targetVital} = ${VITALS[targetVital].unit === "ms" ? Math.round(currentValue) + "ms" : currentValue.toFixed(3)} (good: <${VITALS[targetVital].good}${VITALS[targetVital].unit})`
        )
      );
      if (loop === 1) {
        console.log(
          chalk.dim(
            "  This page is already performing well for " + targetVital + "."
          )
        );
      } else {
        console.log(
          chalk.dim(`  Took ${loop - 1} optimization loop(s).`)
        );
      }
      console.log(
        chalk.dim(
          "\n  Want deeper optimization? " +
            chalk.white.underline("intro.co/GonzaloMaldonado") +
            "\n"
        )
      );
      break;
    }

    // ── LEVERAGE ─────────────────────────────────────────────────

    console.log(chalk.hex("#4AF626").bold("\n  LEVERAGE"));
    console.log(chalk.dim("  Analyzing with AI...\n"));

    let suggestion;
    try {
      suggestion = await analyzeWithAI(
        model,
        targetVital,
        metrics,
        diagnostics,
        sourceFiles,
        loop,
        previousSuggestions
      );
    } catch (err) {
      console.log(chalk.red(`  AI analysis failed: ${err.message}\n`));
      break;
    }

    // Display the suggestion
    for (const line of suggestion.split("\n")) {
      if (
        line.startsWith("DIAGNOSIS:") ||
        line.startsWith("FILE:") ||
        line.startsWith("LINE:") ||
        line.startsWith("WHY:")
      ) {
        const [label, ...rest] = line.split(":");
        console.log(
          chalk.hex("#FF8C00")(`    ${label}:`) +
            chalk.white(rest.join(":"))
        );
      } else if (line.startsWith("BEFORE:") || line.startsWith("AFTER:")) {
        console.log(chalk.hex("#FF8C00")(`    ${line}`));
      } else {
        console.log(chalk.hex("#89b4fa")(`    ${line}`));
      }
    }

    // ── OPERATE ─────────────────────────────────────────────────

    console.log(chalk.hex("#4AF626").bold("\n  OPERATE"));
    const action = await rl.question(
      chalk.hex("#FF8C00")("  Apply this fix? ") +
        chalk.dim("[y = apply / s = skip / q = quit]: ")
    );

    const choice = action.trim().toLowerCase();
    if (choice === "q" || choice === "quit") {
      console.log(chalk.dim("\n  Loop ended by user.\n"));
      break;
    }

    if (choice === "y" || choice === "yes") {
      previousSuggestions.push(suggestion.split("\n")[0]); // store diagnosis
      console.log(
        chalk.dim(
          "  Apply the change above to your code, then press Enter to re-measure."
        )
      );
      await rl.question(chalk.dim("  Press Enter when ready..."));
      // Re-read source files in case they changed
      const updatedFiles = discoverPageFiles(projectRoot, route);
      if (updatedFiles.length > 0) {
        sourceFiles.length = 0;
        sourceFiles.push(...updatedFiles);
      }
    } else {
      previousSuggestions.push(`SKIPPED: ${suggestion.split("\n")[0]}`);
      console.log(chalk.dim("  Skipped. Moving to next suggestion.\n"));
    }

    if (loop === maxLoops) {
      console.log(
        chalk.hex("#FF8C00")(`\n  Reached max loops (${maxLoops}).`)
      );
      console.log(
        chalk.dim(
          "  For deeper performance work: " +
            chalk.white.underline("intro.co/GonzaloMaldonado") +
            "\n"
        )
      );
    }
  }

  rl.close();
}

main().catch((err) => {
  console.error(chalk.red(`\n  Error: ${err.message}\n`));
  process.exit(1);
});
