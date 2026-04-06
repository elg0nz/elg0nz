import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import Spinner from "ink-spinner";
import { VITALS } from "./vitals.mjs";
import { runLighthouse, extractMetrics, extractDiagnostics } from "./lighthouse.mjs";
import { discoverPageFiles } from "./source-discovery.mjs";
import { analyzeWithAI } from "./ai-analysis.mjs";
import { parseSuggestion, applyEdit } from "./code-editor.mjs";
import { VitalLine, ScoreDisplay, SuggestionDisplay } from "./display.mjs";

const h = React.createElement;

// ── Pure functions (exported for testing) ─────────────────────────────

export function gather(targetUrl) {
  const report = runLighthouse(targetUrl);
  return {
    metrics: extractMetrics(report),
    diagnostics: extractDiagnostics(report),
  };
}

export function checkTarget(targetVital, metrics, loop) {
  const currentValue = metrics[targetVital]?.value;
  if (currentValue === undefined || currentValue > VITALS[targetVital].good) {
    return null;
  }
  const vitalInfo = VITALS[targetVital];
  const display =
    vitalInfo.unit === "ms"
      ? Math.round(currentValue) + "ms"
      : currentValue.toFixed(3);
  return {
    met: true,
    display,
    message:
      loop === 1
        ? `This page is already performing well for ${targetVital}.`
        : `Took ${loop - 1} optimization loop(s).`,
  };
}

// ── Ink Component ─────────────────────────────────────────────────────

// States: gathering → gathered → leveraging → operating → next-loop
// Also: done, error

export function LoopRunner({ backend, targetUrl, route, targetVital, maxLoops }) {
  const { exit } = useApp();
  const [phase, setPhase] = useState("gathering");
  const [loop, setLoop] = useState(1);
  const [metrics, setMetrics] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [editResult, setEditResult] = useState(null);
  const [targetResult, setTargetResult] = useState(null);
  const [error, setError] = useState(null);
  const [previousSuggestions] = useState([]);
  const [sourceFiles, setSourceFiles] = useState(() => {
    const projectRoot = process.env.INIT_CWD || process.cwd();
    return discoverPageFiles(projectRoot, route);
  });

  // ── Gather phase ──
  useEffect(() => {
    if (phase !== "gathering") return;
    const timer = setTimeout(() => {
      try {
        const result = gather(targetUrl);
        setMetrics(result.metrics);
        setDiagnostics(result.diagnostics);

        const check = checkTarget(targetVital, result.metrics, loop);
        if (check) {
          setTargetResult(check);
          setPhase("done");
        } else {
          setPhase("leveraging");
        }
      } catch (err) {
        setError(`Lighthouse failed: ${err.message}`);
        setPhase("error");
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [phase, loop]);

  // ── Leverage phase ──
  useEffect(() => {
    if (phase !== "leveraging") return;
    let cancelled = false;
    analyzeWithAI(
      backend,
      targetVital,
      metrics,
      diagnostics,
      sourceFiles,
      loop,
      previousSuggestions
    )
      .then((s) => {
        if (cancelled) return;
        setSuggestion(s);
        setPhase("operating");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(`AI analysis failed: ${err.message}`);
        setPhase("done");
      });
    return () => {
      cancelled = true;
    };
  }, [phase]);

  // ── Operate input (y/s/q) ──
  useInput((input) => {
    if (phase !== "operating") return;
    const projectRoot = process.env.INIT_CWD || process.cwd();

    if (input === "y") {
      const edit = parseSuggestion(suggestion);
      const result = applyEdit(projectRoot, edit);
      setEditResult(result);
      previousSuggestions.push(suggestion.split("\n")[0]);
      const newSourceFiles = discoverPageFiles(projectRoot, route);
      setSourceFiles(newSourceFiles);
      advanceLoop();
    } else if (input === "s") {
      previousSuggestions.push(`SKIPPED: ${suggestion.split("\n")[0]}`);
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
      setDiagnostics(null);
      setSuggestion(null);
      setEditResult(null);
      setLoop((l) => l + 1);
      setPhase("gathering");
    }
  }

  // ── Render ──
  const elems = [];

  // Loop header
  elems.push(
    h(
      Text,
      { key: "header", color: "#FF8C00" },
      `\n  \u2500\u2500 Loop ${loop}/${maxLoops} ${"\u2500".repeat(42)}`
    )
  );

  // Gathering
  if (phase === "gathering") {
    elems.push(
      h(Text, { key: "gather-label", color: "#4AF626", bold: true }, "\n  GATHER")
    );
    elems.push(
      h(
        Text,
        { key: "gather-spinner" },
        h(Text, { dimColor: true }, "  "),
        h(Spinner, { type: "dots" }),
        h(Text, { dimColor: true }, " Running Lighthouse...")
      )
    );
  }

  // Show metrics when available
  if (metrics) {
    elems.push(
      h(Text, { key: "gather-done", color: "#4AF626", bold: true }, "\n  GATHER")
    );
    elems.push(h(ScoreDisplay, { key: "score", score: metrics.performanceScore }));
    for (const key of Object.keys(VITALS)) {
      const val = metrics[key]?.value;
      if (val !== undefined && val !== null) {
        elems.push(h(VitalLine, { key: `vital-${key}`, vitalKey: key, value: val }));
      }
    }
  }

  // Leveraging
  if (phase === "leveraging") {
    elems.push(
      h(Text, { key: "lever-label", color: "#4AF626", bold: true }, "\n  LEVERAGE")
    );
    elems.push(
      h(
        Text,
        { key: "lever-spinner" },
        h(Text, { dimColor: true }, "  "),
        h(Spinner, { type: "dots" }),
        h(Text, { dimColor: true }, " Analyzing with AI...")
      )
    );
  }

  // Operating
  if (phase === "operating" && suggestion) {
    elems.push(
      h(Text, { key: "lever-done", color: "#4AF626", bold: true }, "\n  LEVERAGE")
    );
    elems.push(h(SuggestionDisplay, { key: "suggestion", suggestion }));
    elems.push(
      h(Text, { key: "operate-label", color: "#4AF626", bold: true }, "\n  OPERATE")
    );
    if (editResult) {
      elems.push(
        editResult.ok
          ? h(Text, { key: "edit-ok", color: "green" }, `  \u2713 Code ${editResult.action}`)
          : h(Text, { key: "edit-fail", color: "red" }, `  \u2717 ${editResult.reason}`)
      );
    }
    elems.push(
      h(
        Text,
        { key: "operate-prompt", dimColor: true },
        "  Apply? [y]es / [s]kip / [q]uit"
      )
    );
  }

  // Error
  if (phase === "error") {
    elems.push(h(Text, { key: "error", color: "red" }, `\n  ${error}`));
    elems.push(
      h(
        Text,
        { key: "error-hint", dimColor: true },
        "  Is the page running? Is Chrome installed?"
      )
    );
  }

  // Done
  if (phase === "done") {
    if (targetResult) {
      elems.push(
        h(
          Text,
          { key: "target-met", color: "green", bold: true },
          `\n  Target met! ${targetVital} = ${targetResult.display} (good: <${VITALS[targetVital].good}${VITALS[targetVital].unit})`
        )
      );
      elems.push(
        h(Text, { key: "target-msg", dimColor: true }, `  ${targetResult.message}`)
      );
    } else if (loop >= maxLoops && !error) {
      elems.push(
        h(
          Text,
          { key: "max-loops", color: "#FF8C00" },
          `\n  Reached max loops (${maxLoops}).`
        )
      );
    }
    elems.push(
      h(
        Text,
        { key: "cta", dimColor: true },
        "\n  Want deeper optimization? intro.co/GonzaloMaldonado\n"
      )
    );
  }

  return h(Box, { flexDirection: "column" }, ...elems);
}
