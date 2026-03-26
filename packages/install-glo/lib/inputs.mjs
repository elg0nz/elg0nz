import chalk from "chalk";
import { VITALS } from "./vitals.mjs";

function printClaudeTip(aiBackend) {
  if (aiBackend !== "sdk" && /\bclaude\b/i.test(aiBackend)) {
    console.log("");
    console.log(
      chalk.hex("#FF8C00")("  Tip: ") +
        chalk.dim("For fully autonomous edits (risky), use:")
    );
    console.log(
      chalk.hex("#4AF626")("    claude --dangerously-skip-permissions -p")
    );
  }
}

export async function collectCliInputs(rl) {
  const cmdInput = await rl.question(
    chalk.hex("#FF8C00")("  Command to optimize ") +
      chalk.dim("(e.g. npm test, pytest, make build): ")
  );
  const command = cmdInput.trim();
  if (!command) {
    console.log(chalk.red("\n  A command is required.\n"));
    rl.close();
    process.exit(1);
  }

  console.log("");
  console.log(
    chalk.dim(
      "  Running test suites is a great use case! The loop will measure\n" +
        "  execution time and suggest optimizations to speed things up."
    )
  );
  console.log("");

  const metricInput = await rl.question(
    chalk.hex("#FF8C00")("  Metric to optimize ") +
      chalk.dim("(default: execution_time): ")
  );
  const metric = metricInput.trim() || "execution_time";

  const srcInput = await rl.question(
    chalk.hex("#FF8C00")("  Source paths ") +
      chalk.dim("(comma-separated dirs/files, default: src,lib,test): ")
  );
  const sourcePaths = srcInput.trim()
    ? srcInput.split(",").map((s) => s.trim())
    : ["src", "lib", "test"];

  const maxInput = await rl.question(
    chalk.hex("#FF8C00")("  Max loops ") + chalk.dim("(default: 10): ")
  );
  const maxLoops = parseInt(maxInput.trim(), 10) || 10;

  const aiInput = await rl.question(
    chalk.hex("#FF8C00")("  AI backend ") +
      chalk.dim("(default: Vercel AI, or a CLI command e.g. 'claude -p' / 'llm'): ")
  );
  const rawAi = aiInput.trim().toLowerCase();
  const aiBackend = (!rawAi || rawAi === "vercel ai" || rawAi === "vercel") ? "sdk" : aiInput.trim();

  console.log("");
  console.log(
    chalk.hex("#FF8C00")("  Command: ") + chalk.white(command)
  );
  console.log(
    chalk.hex("#FF8C00")("  Metric:  ") + chalk.white(metric)
  );
  console.log(
    chalk.hex("#FF8C00")("  Sources: ") + chalk.white(sourcePaths.join(", "))
  );
  console.log(
    chalk.hex("#FF8C00")("  Loops:   ") + chalk.white(`${maxLoops} max`)
  );
  console.log(
    chalk.hex("#FF8C00")("  AI:      ") +
      chalk.white(aiBackend === "sdk" ? "Vercel AI SDK" : aiBackend)
  );
  printClaudeTip(aiBackend);

  return { command, metric, sourcePaths, maxLoops, aiBackend };
}

export async function collectInputs(rl) {
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

  const aiInput = await rl.question(
    chalk.hex("#FF8C00")("  AI backend ") +
      chalk.dim("(default: Vercel AI, or a CLI command e.g. 'claude -p' / 'llm'): ")
  );
  const rawAi = aiInput.trim().toLowerCase();
  const aiBackend = (!rawAi || rawAi === "vercel ai" || rawAi === "vercel") ? "sdk" : aiInput.trim();

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
  console.log(
    chalk.hex("#FF8C00")("  AI:     ") +
      chalk.white(aiBackend === "sdk" ? "Vercel AI SDK" : aiBackend)
  );
  printClaudeTip(aiBackend);

  return { targetUrl, route, targetVital, maxLoops, aiBackend };
}
