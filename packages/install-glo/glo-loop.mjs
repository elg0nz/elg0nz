#!/usr/bin/env node

import { createInterface } from "node:readline/promises";
import chalk from "chalk";

import { getModel } from "./lib/model.mjs";
import { animateCassette, printCassette } from "./lib/cassette.mjs";
import { selectLoop } from "./lib/loop-selector.mjs";
import { collectInputs, collectCliInputs } from "./lib/inputs.mjs";
import { runLoop } from "./lib/loop-runner.mjs";
import { runCliLoop } from "./lib/cli-loop-runner.mjs";
import { generateGloopFile } from "./lib/gloop-generator.mjs";

function resolveBackend(rl, aiBackend) {
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
    return { type: "sdk", model: resolved.model };
  }
  console.log(chalk.dim(`\n  AI: ${aiBackend} (CLI)`));
  return { type: "cli", command: aiBackend };
}

async function main() {
  if (process.stdout.isTTY) {
    await animateCassette();
  } else {
    printCassette();
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const projectRoot = process.env.INIT_CWD || process.cwd();

  // Step 1: Detect GLOOP.md or let user select a loop
  const selected = await selectLoop(rl, projectRoot);

  // Step 2: Collect inputs based on loop type
  if (selected.type === "web-vitals") {
    const { targetUrl, route, targetVital, maxLoops, aiBackend } =
      await collectInputs(rl);

    const backend = resolveBackend(rl, aiBackend);
    await runLoop({ rl, backend, targetUrl, route, targetVital, maxLoops });
  } else if (selected.type === "cli-timing") {
    const { command, metric, sourcePaths, maxLoops, aiBackend } =
      await collectCliInputs(rl);

    const backend = resolveBackend(rl, aiBackend);
    await runCliLoop({ rl, backend, command, metric, maxLoops, sourcePaths });
  } else if (selected.type === "generate-gloop") {
    await generateGloopFile(rl, projectRoot);
  } else if (selected.source === "gloop-file") {
    // Custom GLOOP.md — route based on its type field, fallback to cli-timing
    const cfg = selected.config;
    const loopType = cfg.type || "cli-timing";

    if (loopType === "web-vitals") {
      const { targetUrl, route, targetVital, maxLoops, aiBackend } =
        await collectInputs(rl);
      const backend = resolveBackend(rl, aiBackend);
      await runLoop({ rl, backend, targetUrl, route, targetVital, maxLoops });
    } else {
      const { command, metric, sourcePaths, maxLoops, aiBackend } =
        await collectCliInputs(rl);
      const backend = resolveBackend(rl, aiBackend);
      await runCliLoop({ rl, backend, command, metric, maxLoops, sourcePaths });
    }
  }

  rl.close();
}

main().catch((err) => {
  console.error(chalk.red(`\n  Error: ${err.message}\n`));
  process.exit(1);
});
