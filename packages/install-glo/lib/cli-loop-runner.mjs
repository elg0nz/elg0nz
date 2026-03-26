import chalk from "chalk";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { runTimed, extractTimingMetrics } from "./cli-timing.mjs";
import { analyzeCliWithAI } from "./cli-ai-analysis.mjs";
import { parseSuggestion, applyEdit } from "./code-editor.mjs";

const MAX_FILE_SIZE = 15_000;

function discoverSourceFiles(projectRoot, patterns) {
  const files = [];
  const seen = new Set();

  for (const pattern of patterns) {
    const fullPath = join(projectRoot, pattern);
    if (!existsSync(fullPath)) continue;

    const stat = statSync(fullPath);
    if (stat.isFile()) {
      addFile(projectRoot, fullPath, files, seen);
    } else if (stat.isDirectory()) {
      scanDir(projectRoot, fullPath, files, seen, 2);
    }
  }

  return files;
}

function scanDir(projectRoot, dir, files, seen, depth) {
  if (depth <= 0) return;
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (entry.startsWith(".") || entry === "node_modules") continue;
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isFile() && isSourceFile(entry)) {
        addFile(projectRoot, full, files, seen);
      } else if (stat.isDirectory()) {
        scanDir(projectRoot, full, files, seen, depth - 1);
      }
    }
  } catch {}
}

function isSourceFile(name) {
  return /\.(js|mjs|cjs|ts|tsx|jsx|py|rb|sh|json|yaml|yml|toml)$/.test(name);
}

function addFile(projectRoot, fullPath, files, seen) {
  const relPath = relative(projectRoot, fullPath);
  if (seen.has(relPath)) return;
  seen.add(relPath);
  try {
    let content = readFileSync(fullPath, "utf8");
    if (content.length > MAX_FILE_SIZE) {
      content = content.slice(0, MAX_FILE_SIZE) + "\n// ... truncated";
    }
    files.push({ path: relPath, content });
  } catch {}
}

function formatTiming(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = ((ms % 60000) / 1000).toFixed(1);
  return `${mins}m ${secs}s`;
}

export async function runCliLoop({ rl, backend, command, metric, maxLoops, sourcePaths }) {
  const projectRoot = process.env.INIT_CWD || process.cwd();
  let sourceFiles = discoverSourceFiles(projectRoot, sourcePaths);

  if (sourceFiles.length > 0) {
    console.log(
      chalk.hex("#FF8C00")("  Files:  ") +
        chalk.dim(sourceFiles.map((f) => f.path).join(", "))
    );
  }

  const previousSuggestions = [];
  let bestTime = Infinity;

  for (let loop = 1; loop <= maxLoops; loop++) {
    console.log(
      chalk.hex("#FF8C00")(
        `\n  ── Loop ${loop}/${maxLoops} ${"─".repeat(42)}`
      )
    );

    // GATHER
    console.log(chalk.hex("#4AF626").bold("\n  GATHER"));
    console.log(chalk.dim(`  Running: ${command}\n`));

    const timedResult = await runTimed(command);
    const metrics = extractTimingMetrics(timedResult, metric);

    const timeVal = metrics.execution_time.value;
    const improved = timeVal < bestTime;
    if (timeVal < bestTime) bestTime = timeVal;

    const timeColor = improved ? chalk.green : chalk.yellow;
    console.log(
      chalk.white("    Time    ") +
        timeColor.bold(formatTiming(timeVal)) +
        (loop > 1 && improved
          ? chalk.green(` ↓ improved`)
          : "")
    );
    console.log(
      chalk.white("    Exit    ") +
        (timedResult.exitCode === 0
          ? chalk.green("0 ✓")
          : chalk.red(`${timedResult.exitCode} ✗`))
    );

    if (timedResult.exitCode !== 0) {
      console.log(chalk.dim("\n  Command output (last 500 chars):"));
      console.log(chalk.dim("  " + timedResult.output.slice(-500).replace(/\n/g, "\n  ")));
    }

    // LEVERAGE
    console.log(chalk.hex("#4AF626").bold("\n  LEVERAGE"));
    console.log(chalk.dim("  Analyzing with AI...\n"));

    let suggestion;
    try {
      suggestion = await analyzeCliWithAI(
        backend, command, metrics, sourceFiles,
        loop, previousSuggestions, metric
      );
    } catch (err) {
      console.log(chalk.red(`  AI analysis failed: ${err.message}\n`));
      break;
    }

    // OPERATE
    console.log(chalk.hex("#4AF626").bold("\n  OPERATE"));

    const edit = parseSuggestion(suggestion);
    const editResult = applyEdit(projectRoot, edit);

    if (editResult.ok) {
      console.log(chalk.green(`  ✓ Code ${editResult.action} in ${edit.file}`));
    } else {
      console.log(chalk.red(`  ✗ ${editResult.reason}`));
      console.log(chalk.dim("  Fix manually, then press Enter to re-measure."));
      await rl.question(chalk.dim("  Press Enter when ready..."));
    }

    previousSuggestions.push(suggestion.split("\n")[0]);
    sourceFiles = discoverSourceFiles(projectRoot, sourcePaths);

    if (loop === maxLoops) {
      console.log(chalk.hex("#FF8C00")(`\n  Reached max loops (${maxLoops}).`));
      console.log(
        chalk.dim(
          "  Best time achieved: " + chalk.white(formatTiming(bestTime))
        )
      );
      console.log(
        chalk.dim(
          "\n  For deeper optimization: " +
            chalk.white.underline("intro.co/GonzaloMaldonado") +
            "\n"
        )
      );
    }
  }
}
