import chalk from "chalk";
import { VITALS } from "./vitals.mjs";
import { runLighthouse, extractMetrics, extractDiagnostics } from "./lighthouse.mjs";
import { discoverPageFiles } from "./source-discovery.mjs";
import { analyzeWithAI } from "./ai-analysis.mjs";
import { parseSuggestion, applyEdit } from "./code-editor.mjs";
import { formatVital, printScore, printSuggestion } from "./display.mjs";

function gather(targetUrl) {
  const report = runLighthouse(targetUrl);
  return {
    metrics: extractMetrics(report),
    diagnostics: extractDiagnostics(report),
  };
}

function checkTarget(targetVital, metrics, loop) {
  const currentValue = metrics[targetVital]?.value;
  if (currentValue === undefined || currentValue > VITALS[targetVital].good) {
    return false;
  }
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
  return true;
}

async function operate(rl, suggestion, projectRoot, route) {
  console.log(chalk.hex("#4AF626").bold("\n  OPERATE"));

  const edit = parseSuggestion(suggestion);

  const action = await rl.question(
    chalk.hex("#FF8C00")("  Apply this fix? ") +
      chalk.dim("[y = apply / s = skip / q = quit]: ")
  );

  const choice = action.trim().toLowerCase();
  if (choice === "q" || choice === "quit") {
    console.log(chalk.dim("\n  Loop ended by user.\n"));
    return { action: "quit" };
  }

  if (choice === "y" || choice === "yes") {
    const result = applyEdit(projectRoot, edit);
    if (result.ok) {
      console.log(chalk.green(`  ✓ Code ${result.action} in ${edit.file}`));
    } else {
      console.log(chalk.red(`  ✗ ${result.reason}`));
      console.log(chalk.dim("  Apply manually, then press Enter to re-measure."));
      await rl.question(chalk.dim("  Press Enter when ready..."));
    }
    const sourceFiles = discoverPageFiles(projectRoot, route);
    return { action: "applied", summary: suggestion.split("\n")[0], sourceFiles };
  }

  return { action: "skipped", summary: suggestion.split("\n")[0] };
}

export async function runLoop({ rl, backend, targetUrl, route, targetVital, maxLoops }) {
  const projectRoot = process.env.INIT_CWD || process.cwd();
  let sourceFiles = discoverPageFiles(projectRoot, route);
  if (sourceFiles.length > 0) {
    console.log(
      chalk.hex("#FF8C00")("  Files:  ") +
        chalk.dim(sourceFiles.map((f) => f.path).join(", "))
    );
  }

  const previousSuggestions = [];

  for (let loop = 1; loop <= maxLoops; loop++) {
    console.log(
      chalk.hex("#FF8C00")(
        `\n  ── Loop ${loop}/${maxLoops} ${"─".repeat(42)}`
      )
    );

    console.log(chalk.hex("#4AF626").bold("\n  GATHER"));
    console.log(chalk.dim("  Running Lighthouse...\n"));

    let metrics, diagnostics;
    try {
      ({ metrics, diagnostics } = gather(targetUrl));
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

    if (checkTarget(targetVital, metrics, loop)) break;

    console.log(chalk.hex("#4AF626").bold("\n  LEVERAGE"));
    console.log(chalk.dim("  Analyzing with AI...\n"));

    let suggestion;
    try {
      suggestion = await analyzeWithAI(
        backend, targetVital, metrics, diagnostics,
        sourceFiles, loop, previousSuggestions
      );
    } catch (err) {
      console.log(chalk.red(`  AI analysis failed: ${err.message}\n`));
      break;
    }

    printSuggestion(suggestion);

    const result = await operate(rl, suggestion, projectRoot, route);
    if (result.action === "quit") break;
    if (result.action === "applied") {
      previousSuggestions.push(result.summary);
      sourceFiles = result.sourceFiles;
    } else {
      previousSuggestions.push(`SKIPPED: ${result.summary}`);
      console.log(chalk.dim("  Skipped. Moving to next suggestion.\n"));
    }

    if (loop === maxLoops) {
      console.log(chalk.hex("#FF8C00")(`\n  Reached max loops (${maxLoops}).`));
      console.log(
        chalk.dim(
          "  For deeper performance work: " +
            chalk.white.underline("intro.co/GonzaloMaldonado") +
            "\n"
        )
      );
    }
  }
}
