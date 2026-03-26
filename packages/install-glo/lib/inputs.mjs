import chalk from "chalk";
import { VITALS } from "./vitals.mjs";

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
      chalk.dim("(default: sdk, or a CLI command e.g. 'claude -p' / 'llm'): ")
  );
  const aiBackend = aiInput.trim() || "sdk";

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

  return { targetUrl, route, targetVital, maxLoops, aiBackend };
}
