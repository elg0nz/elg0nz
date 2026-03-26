#!/usr/bin/env node

import { createInterface } from "node:readline/promises";
import chalk from "chalk";

import { getModel } from "./lib/model.mjs";
import { printBanner } from "./lib/display.mjs";
import { collectInputs } from "./lib/inputs.mjs";
import { runLoop } from "./lib/loop-runner.mjs";

async function main() {
  printBanner();

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  const { targetUrl, route, targetVital, maxLoops, aiBackend } =
    await collectInputs(rl);

  let backend;
  if (aiBackend === "sdk") {
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
      rl.close();
      process.exit(1);
    }
    console.log(chalk.dim(`\n  AI: ${resolved.label} via Vercel AI SDK`));
    backend = { type: "sdk", model: resolved.model };
  } else {
    console.log(chalk.dim(`\n  AI: ${aiBackend} (CLI)`));
    backend = { type: "cli", command: aiBackend };
  }

  await runLoop({ rl, backend, targetUrl, route, targetVital, maxLoops });

  rl.close();
}

main().catch((err) => {
  console.error(chalk.red(`\n  Error: ${err.message}\n`));
  process.exit(1);
});
