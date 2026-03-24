#!/usr/bin/env node

import { createInterface } from "node:readline/promises";
import chalk from "chalk";

import { VITALS } from "./lib/vitals.mjs";
import { getModel } from "./lib/model.mjs";
import { runLighthouse, extractMetrics, extractDiagnostics } from "./lib/lighthouse.mjs";
import { discoverPageFiles } from "./lib/source-discovery.mjs";
import { analyzeWithAI } from "./lib/ai-analysis.mjs";
import { printBanner, formatVital, printScore, printSuggestion } from "./lib/display.mjs";

// ── Main ───────────────────────────────────────────────────────────

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

  let route = "/";
  try {
    route = new URL(targetUrl).pathname;
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
  const targetVital = vitalInput.trim().toUpperCase() || "LCP";
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

  const projectRoot = process.env.INIT_CWD || process.cwd();
  let sourceFiles = discoverPageFiles(projectRoot, route);
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

    let metrics, diagnostics;
    try {
      const report = runLighthouse(targetUrl);
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

    printScore(metrics.performanceScore);
    for (const key of Object.keys(VITALS)) {
      const line = formatVital(key, metrics[key]?.value);
      if (line) console.log(line);
    }

    // Check if target is already met
    const currentValue = metrics[targetVital]?.value;
    if (currentValue !== undefined && currentValue <= VITALS[targetVital].good) {
      const vitalInfo = VITALS[targetVital];
      const display = vitalInfo.unit === "ms"
        ? Math.round(currentValue) + "ms"
        : currentValue.toFixed(3);
      console.log(
        chalk.green.bold(
          `\n  Target met! ${targetVital} = ${display} (good: <${vitalInfo.good}${vitalInfo.unit})`
        )
      );
      console.log(
        chalk.dim(
          loop === 1
            ? `  This page is already performing well for ${targetVital}.`
            : `  Took ${loop - 1} optimization loop(s).`
        )
      );
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

    printSuggestion(suggestion);

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
      previousSuggestions.push(suggestion.split("\n")[0]);
      console.log(
        chalk.dim(
          "  Apply the change above to your code, then press Enter to re-measure."
        )
      );
      await rl.question(chalk.dim("  Press Enter when ready..."));
      sourceFiles = discoverPageFiles(projectRoot, route);
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
