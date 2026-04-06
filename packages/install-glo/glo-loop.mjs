#!/usr/bin/env node

import React, { useState } from "react";
import { render, Box, Text, useApp } from "ink";
import { createInterface } from "node:readline/promises";
import chalk from "chalk";

import { getModel } from "./lib/model.mjs";
import { animateCassette, printCassette } from "./lib/cassette.mjs";
import { selectLoop } from "./lib/loop-selector.mjs";
import { collectCliInputs } from "./lib/inputs-cli.mjs";
import { InputForm, ConfigSummary } from "./lib/inputs.mjs";
import { Banner } from "./lib/display.mjs";
import { LoopRunner } from "./lib/loop-runner.mjs";
import { runCliLoop } from "./lib/cli-loop-runner.mjs";
import { generateGloopFile } from "./lib/gloop-generator.mjs";

const h = React.createElement;

function resolveBackend(aiBackend) {
  if (aiBackend === "sdk") {
    const resolved = getModel();
    if (!resolved) return null;
    return { type: "sdk", model: resolved.model, label: resolved.label };
  }
  return { type: "cli", command: aiBackend, label: `${aiBackend} (CLI)` };
}

// ── Ink App for web-vitals path ─────────────────────────────────────

function GloApp() {
  const { exit } = useApp();
  const [phase, setPhase] = useState("input"); // input → running → no-key
  const [config, setConfig] = useState(null);
  const [backend, setBackend] = useState(null);

  const handleInputComplete = (inputs) => {
    const resolved = resolveBackend(inputs.aiBackend);
    if (!resolved) {
      setPhase("no-key");
      return;
    }
    setBackend(resolved);
    setConfig(inputs);
    setPhase("running");
  };

  if (phase === "input") {
    return h(
      Box,
      { flexDirection: "column" },
      h(Banner),
      h(Text, null, ""),
      h(InputForm, { onComplete: handleInputComplete })
    );
  }

  if (phase === "no-key") {
    return h(
      Box,
      { flexDirection: "column" },
      h(Text, { color: "white" }, "  Set an API key to power the AI analysis:\n"),
      h(
        Text,
        null,
        h(Text, { color: "#4AF626" }, "    export ANTHROPIC_API_KEY=sk-ant-..."),
        h(Text, { dimColor: true }, "  (recommended)")
      ),
      h(Text, { color: "#4AF626" }, "    export OPENAI_API_KEY=sk-..."),
      h(
        Text,
        { dimColor: true },
        "\n  Then run: ",
        h(Text, { color: "white" }, "npm run glo-loop"),
        "\n"
      )
    );
  }

  if (phase === "running") {
    return h(
      Box,
      { flexDirection: "column" },
      h(ConfigSummary, { config }),
      h(Text, { dimColor: true }, `\n  AI: ${backend.label}`),
      h(LoopRunner, {
        backend,
        targetUrl: config.targetUrl,
        route: config.route,
        targetVital: config.targetVital,
        maxLoops: config.maxLoops,
      })
    );
  }

  return null;
}

// ── Main ───────────────────────────────────────────────────────────────

function resolveBackendLegacy(rl, aiBackend) {
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
  // Step 1: Cassette animation (pre-Ink)
  if (process.stdout.isTTY) {
    await animateCassette();
  } else {
    printCassette();
  }

  // Step 2: Loop selection (pre-Ink, uses readline)
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const projectRoot = process.env.INIT_CWD || process.cwd();
  const selected = await selectLoop(rl, projectRoot);
  rl.close();

  // Step 3: Route based on selection
  const isWebVitals =
    selected.type === "web-vitals" ||
    (selected.source === "gloop-file" &&
      (selected.config.type || "cli-timing") === "web-vitals");

  if (isWebVitals) {
    // Ink path for web-vitals
    const app = render(h(GloApp));
    await app.waitUntilExit();
  } else if (selected.type === "generate-gloop") {
    const rl2 = createInterface({ input: process.stdin, output: process.stdout });
    await generateGloopFile(rl2, projectRoot);
    rl2.close();
  } else {
    // cli-timing path (legacy readline)
    const rl2 = createInterface({ input: process.stdin, output: process.stdout });
    const { command, metric, sourcePaths, maxLoops, aiBackend } =
      await collectCliInputs(rl2);
    const backend = resolveBackendLegacy(rl2, aiBackend);
    await runCliLoop({ rl: rl2, backend, command, metric, maxLoops, sourcePaths });
    rl2.close();
  }
}

main().catch((err) => {
  console.error(`\n  Error: ${err.message}\n`);
  process.exit(1);
});
