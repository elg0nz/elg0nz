#!/usr/bin/env node

import React, { useState } from "react";
import { render, Box, Text, useApp } from "ink";

import { getModel } from "./lib/model.mjs";
import { CassetteAnimation, CassetteStatic } from "./lib/cassette.mjs";
import { LoopSelector } from "./lib/loop-selector.mjs";
import { InputForm, ConfigSummary } from "./lib/inputs.mjs";
import { CliInputForm, CliConfigSummary } from "./lib/inputs-cli.mjs";
import { Banner } from "./lib/display.mjs";
import { LoopRunner } from "./lib/loop-runner.mjs";
import { CliLoopRunner } from "./lib/cli-loop-runner.mjs";
import { GloopGenerator } from "./lib/gloop-generator.mjs";

const h = React.createElement;

function resolveBackend(aiBackend) {
  if (aiBackend === "sdk") {
    const resolved = getModel();
    if (!resolved) return null;
    return { type: "sdk", model: resolved.model, label: resolved.label };
  }
  return { type: "cli", command: aiBackend, label: `${aiBackend} (CLI)` };
}

// Phases: cassette → select → input → running → no-key → gloop-gen

function GloApp() {
  const { exit } = useApp();
  const isTTY = process.stdout.isTTY;
  const projectRoot = process.env.INIT_CWD || process.cwd();

  const [phase, setPhase] = useState(isTTY ? "cassette" : "select");
  const [loopType, setLoopType] = useState(null); // web-vitals | cli-timing | generate-gloop
  const [selected, setSelected] = useState(null);
  const [config, setConfig] = useState(null);
  const [backend, setBackend] = useState(null);

  // Cassette animation done
  const handleCassetteComplete = () => setPhase("select");

  // Loop selected
  const handleLoopSelect = (sel) => {
    setSelected(sel);
    const type = sel.type;

    if (type === "generate-gloop") {
      setLoopType("generate-gloop");
      setPhase("gloop-gen");
      return;
    }

    // Determine effective type for gloop-file
    const effectiveType =
      sel.source === "gloop-file"
        ? (sel.config.type || "cli-timing")
        : type;

    setLoopType(effectiveType);
    setPhase("input");
  };

  // Web-vitals input complete
  const handleWebVitalsInput = (inputs) => {
    const resolved = resolveBackend(inputs.aiBackend);
    if (!resolved) {
      setPhase("no-key");
      return;
    }
    setBackend(resolved);
    setConfig(inputs);
    setPhase("running");
  };

  // CLI timing input complete
  const handleCliInput = (inputs) => {
    const resolved = resolveBackend(inputs.aiBackend);
    if (!resolved) {
      setPhase("no-key");
      return;
    }
    setBackend(resolved);
    setConfig(inputs);
    setPhase("running");
  };

  // ── Cassette ──
  if (phase === "cassette") {
    return h(CassetteAnimation, { onComplete: handleCassetteComplete });
  }

  // ── Static cassette + loop selector ──
  if (phase === "select") {
    return h(
      Box,
      { flexDirection: "column" },
      !isTTY ? h(CassetteStatic) : null,
      h(LoopSelector, { projectRoot, onSelect: handleLoopSelect })
    );
  }

  // ── GLOOP.md generator ──
  if (phase === "gloop-gen") {
    return h(GloopGenerator, { projectRoot, onComplete: () => exit() });
  }

  // ── Input phase ──
  if (phase === "input") {
    if (loopType === "web-vitals") {
      return h(
        Box,
        { flexDirection: "column" },
        h(Banner),
        h(Text, null, ""),
        h(InputForm, { onComplete: handleWebVitalsInput })
      );
    }
    // cli-timing
    return h(
      Box,
      { flexDirection: "column" },
      h(Banner),
      h(Text, null, ""),
      h(CliInputForm, { onComplete: handleCliInput })
    );
  }

  // ── No API key ──
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

  // ── Running ──
  if (phase === "running") {
    if (loopType === "web-vitals") {
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
    // cli-timing
    return h(
      Box,
      { flexDirection: "column" },
      h(CliConfigSummary, { config }),
      h(Text, { dimColor: true }, `\n  AI: ${backend.label}`),
      h(CliLoopRunner, {
        backend,
        command: config.command,
        metric: config.metric,
        maxLoops: config.maxLoops,
        sourcePaths: config.sourcePaths,
      })
    );
  }

  return null;
}

const app = render(h(GloApp));
app.waitUntilExit().catch((err) => {
  console.error(`\n  Error: ${err.message}\n`);
  process.exit(1);
});
