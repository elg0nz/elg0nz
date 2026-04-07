import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import Spinner from "ink-spinner";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { runTimed, extractTimingMetrics } from "./cli-timing.mjs";
import { analyzeCliWithAI } from "./cli-ai-analysis.mjs";
import { parseSuggestion, applyEdit } from "./code-editor.mjs";

const h = React.createElement;

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

// States: gathering → gathered → leveraging → operating → next-loop → done

export function CliLoopRunner({ backend, command, metric, maxLoops, sourcePaths }) {
  const { exit } = useApp();
  const [phase, setPhase] = useState("gathering");
  const [loop, setLoop] = useState(1);
  const [metrics, setMetrics] = useState(null);
  const [timedResult, setTimedResult] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [editResult, setEditResult] = useState(null);
  const [error, setError] = useState(null);
  const [bestTime, setBestTime] = useState(Infinity);
  const [improved, setImproved] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [previousSuggestions] = useState([]);
  const [sourceFiles, setSourceFiles] = useState(() => {
    const projectRoot = process.env.INIT_CWD || process.cwd();
    return discoverSourceFiles(projectRoot, sourcePaths);
  });

  // Gather phase
  useEffect(() => {
    if (phase !== "gathering") return;
    let cancelled = false;
    setStreamText("");

    runTimed(command, {
      onChunk: (chunk) => {
        if (!cancelled) setStreamText((t) => t + chunk);
      },
    }).then((result) => {
      if (cancelled) return;
      const m = extractTimingMetrics(result, metric);
      const timeVal = m.execution_time.value;
      const isImproved = timeVal < bestTime;
      if (isImproved) setBestTime(timeVal);
      setImproved(isImproved);
      setTimedResult(result);
      setMetrics(m);
      setPhase("leveraging");
    });

    return () => { cancelled = true; };
  }, [phase, loop]);

  // Leverage phase
  useEffect(() => {
    if (phase !== "leveraging") return;
    let cancelled = false;
    setStreamText("");

    analyzeCliWithAI(
      backend, command, metrics, sourceFiles,
      loop, previousSuggestions, metric,
      {
        onChunk: (chunk) => {
          if (!cancelled) setStreamText((t) => t + chunk);
        },
      }
    )
      .then((s) => {
        if (cancelled) return;
        setSuggestion(s);
        // Auto-apply edit
        const projectRoot = process.env.INIT_CWD || process.cwd();
        const edit = parseSuggestion(s);
        const result = applyEdit(projectRoot, edit);
        setEditResult(result);
        setPhase("operating");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(`AI analysis failed: ${err.message}`);
        setPhase("done");
      });

    return () => { cancelled = true; };
  }, [phase]);

  // Operate input (y/s/q)
  useInput((input) => {
    if (phase !== "operating") return;
    if (input === "y" || input === "s") {
      const projectRoot = process.env.INIT_CWD || process.cwd();
      if (input === "y") {
        previousSuggestions.push(suggestion.split("\n")[0]);
      } else {
        previousSuggestions.push(`SKIPPED: ${suggestion.split("\n")[0]}`);
      }
      setSourceFiles(discoverSourceFiles(projectRoot, sourcePaths));
      advanceLoop();
    } else if (input === "q") {
      exit();
    }
  });

  function advanceLoop() {
    if (loop >= maxLoops) {
      setPhase("done");
    } else {
      setMetrics(null);
      setTimedResult(null);
      setSuggestion(null);
      setEditResult(null);
      setLoop((l) => l + 1);
      setPhase("gathering");
    }
  }

  // Render
  const elems = [];

  elems.push(
    h(Text, { key: "header", color: "#FF8C00" },
      `\n  \u2500\u2500 Loop ${loop}/${maxLoops} ${"\u2500".repeat(42)}`)
  );

  // Gathering
  if (phase === "gathering") {
    elems.push(h(Text, { key: "g-label", color: "#4AF626", bold: true }, "\n  GATHER"));
    elems.push(
      h(Text, { key: "g-spinner" },
        h(Text, { dimColor: true }, "  "),
        h(Spinner, { type: "dots" }),
        h(Text, { dimColor: true }, ` Running: ${command}`)
      )
    );
    if (streamText) {
      elems.push(h(Text, { key: "g-output", dimColor: true }, `    ${streamText.slice(-200)}`));
    }
  }

  // Metrics
  if (metrics) {
    elems.push(h(Text, { key: "g-done", color: "#4AF626", bold: true }, "\n  GATHER"));
    const timeVal = metrics.execution_time.value;
    const timeColor = improved ? "green" : "yellow";
    elems.push(
      h(Text, { key: "time" },
        h(Text, { color: "white" }, "    Time    "),
        h(Text, { color: timeColor, bold: true }, formatTiming(timeVal)),
        loop > 1 && improved ? h(Text, { color: "green" }, " \u2193 improved") : null
      )
    );
    elems.push(
      h(Text, { key: "exit" },
        h(Text, { color: "white" }, "    Exit    "),
        timedResult.exitCode === 0
          ? h(Text, { color: "green" }, "0 \u2713")
          : h(Text, { color: "red" }, `${timedResult.exitCode} \u2717`)
      )
    );
    if (timedResult.exitCode !== 0) {
      elems.push(h(Text, { key: "stderr", dimColor: true }, "\n  Command output (last 500 chars):"));
      elems.push(h(Text, { key: "stderr-out", dimColor: true }, "  " + timedResult.output.slice(-500)));
    }
  }

  // Leveraging
  if (phase === "leveraging") {
    elems.push(h(Text, { key: "l-label", color: "#4AF626", bold: true }, "\n  LEVERAGE"));
    elems.push(
      h(Text, { key: "l-spinner" },
        h(Text, { dimColor: true }, "  "),
        h(Spinner, { type: "dots" }),
        h(Text, { dimColor: true }, " Analyzing with AI...")
      )
    );
    if (streamText) {
      elems.push(h(Text, { key: "l-stream", dimColor: true }, `    ${streamText.slice(-300)}`));
    }
  }

  // Operating
  if (phase === "operating" && suggestion) {
    elems.push(h(Text, { key: "l-done", color: "#4AF626", bold: true }, "\n  LEVERAGE"));
    // Show suggestion lines
    for (const [i, line] of suggestion.split("\n").entries()) {
      if (line.startsWith("DIAGNOSIS:") || line.startsWith("FILE:") || line.startsWith("LINE:") || line.startsWith("WHY:")) {
        const [label, ...rest] = line.split(":");
        elems.push(
          h(Text, { key: `sug-${i}` },
            h(Text, { color: "#FF8C00" }, `    ${label}:`),
            h(Text, { color: "white" }, rest.join(":"))
          )
        );
      } else if (line.startsWith("BEFORE:") || line.startsWith("AFTER:")) {
        elems.push(h(Text, { key: `sug-${i}`, color: "#FF8C00" }, `    ${line}`));
      } else {
        elems.push(h(Text, { key: `sug-${i}`, color: "#89b4fa" }, `    ${line}`));
      }
    }

    elems.push(h(Text, { key: "o-label", color: "#4AF626", bold: true }, "\n  OPERATE"));
    if (editResult) {
      elems.push(
        editResult.ok
          ? h(Text, { key: "edit-ok", color: "green" }, `  \u2713 Code ${editResult.action} in ${parseSuggestion(suggestion).file}`)
          : h(Text, { key: "edit-fail", color: "red" }, `  \u2717 ${editResult.reason}`)
      );
    }
    elems.push(
      h(Text, { key: "o-prompt", dimColor: true }, "  Continue? [y]es / [s]kip / [q]uit")
    );
  }

  // Error
  if (error) {
    elems.push(h(Text, { key: "error", color: "red" }, `\n  ${error}`));
  }

  // Done
  if (phase === "done" && !error) {
    elems.push(
      h(Text, { key: "max-loops", color: "#FF8C00" }, `\n  Reached max loops (${maxLoops}).`)
    );
    elems.push(
      h(Text, { key: "best", dimColor: true },
        "  Best time achieved: ",
        h(Text, { color: "white" }, formatTiming(bestTime))
      )
    );
    elems.push(
      h(Text, { key: "cta", dimColor: true },
        "\n  For deeper optimization: ",
        h(Text, { color: "white", underline: true }, "intro.co/GonzaloMaldonado"),
        "\n"
      )
    );
  }

  return h(Box, { flexDirection: "column" }, ...elems);
}
