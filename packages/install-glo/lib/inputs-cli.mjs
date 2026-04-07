import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

const h = React.createElement;

const STEPS = [
  { key: "command", label: "Command to optimize", defaultVal: "", hint: "(e.g. npm test, pytest, make build)", required: true },
  { key: "metric", label: "Metric to optimize", defaultVal: "execution_time" },
  { key: "sourcePaths", label: "Source paths", defaultVal: "src,lib,test", hint: "(comma-separated dirs/files)" },
  { key: "maxLoops", label: "Max loops", defaultVal: "10" },
  { key: "aiBackend", label: "AI backend", defaultVal: "Vercel AI", hint: "(default: Vercel AI, or CLI e.g. 'claude -p')" },
];

export function CliInputForm({ onComplete }) {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);

  const handleSubmit = (value) => {
    const val = value.trim();
    const newAnswers = { ...answers };

    if (step === 0) {
      if (!val) {
        setError("A command is required.");
        setInput("");
        return;
      }
      newAnswers.command = val;
    } else if (step === 1) {
      newAnswers.metric = val || "execution_time";
    } else if (step === 2) {
      newAnswers.sourcePaths = val
        ? val.split(",").map((s) => s.trim())
        : ["src", "lib", "test"];
    } else if (step === 3) {
      newAnswers.maxLoops = parseInt(val, 10) || 10;
    } else if (step === 4) {
      const raw = val.toLowerCase();
      newAnswers.aiBackend =
        !raw || raw === "vercel ai" || raw === "vercel" ? "sdk" : value.trim();
    }

    setAnswers(newAnswers);
    setInput("");
    setError(null);

    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(newAnswers);
    }
  };

  const elems = [];

  // Tip after command step
  if (step >= 1) {
    elems.push(
      h(Text, { key: "tip", dimColor: true },
        "  Running test suites is a great use case! The loop will measure\n" +
        "  execution time and suggest optimizations to speed things up."
      )
    );
    elems.push(h(Text, { key: "tip-space" }, ""));
  }

  // Previous answers
  for (let i = 0; i < step; i++) {
    const s = STEPS[i];
    let val = answers[s.key];
    if (s.key === "sourcePaths") val = Array.isArray(val) ? val.join(", ") : val;
    else if (s.key === "maxLoops") val = String(val);
    else if (s.key === "aiBackend") val = val === "sdk" ? "Vercel AI SDK" : val;
    elems.push(
      h(
        Text,
        { key: `answer-${i}` },
        h(Text, { color: "#FF8C00" }, `  ${s.label}: `),
        h(Text, { color: "white" }, String(val))
      )
    );
  }

  // Error
  if (error) {
    elems.push(h(Text, { key: "error", color: "red" }, `  ${error}`));
  }

  // Current prompt
  const current = STEPS[step];
  elems.push(
    h(
      Box,
      { key: "prompt" },
      h(Text, { color: "#FF8C00" }, `  ${current.label} `),
      h(Text, { dimColor: true }, current.hint || `(default: ${current.defaultVal})`),
      h(Text, null, ": "),
      h(TextInput, { value: input, onChange: setInput, onSubmit: handleSubmit })
    )
  );

  return h(Box, { flexDirection: "column" }, ...elems);
}

export function CliConfigSummary({ config }) {
  const { command, metric, sourcePaths, maxLoops, aiBackend } = config;
  const paths = Array.isArray(sourcePaths) ? sourcePaths.join(", ") : sourcePaths;
  return h(
    Box,
    { flexDirection: "column" },
    h(Text, null, h(Text, { color: "#FF8C00" }, "  Command: "), h(Text, { color: "white" }, command)),
    h(Text, null, h(Text, { color: "#FF8C00" }, "  Metric:  "), h(Text, { color: "white" }, metric)),
    h(Text, null, h(Text, { color: "#FF8C00" }, "  Sources: "), h(Text, { color: "white" }, paths)),
    h(Text, null, h(Text, { color: "#FF8C00" }, "  Loops:   "), h(Text, { color: "white" }, `${maxLoops} max`)),
    h(
      Text,
      null,
      h(Text, { color: "#FF8C00" }, "  AI:      "),
      h(Text, { color: "white" }, aiBackend === "sdk" ? "Vercel AI SDK" : aiBackend)
    ),
    aiBackend !== "sdk" && /\bclaude\b/i.test(aiBackend)
      ? h(
          Box,
          { key: "claude-tip", flexDirection: "column" },
          h(Text, null, ""),
          h(Text, null, h(Text, { color: "#FF8C00" }, "  Tip: "), h(Text, { dimColor: true }, "For fully autonomous edits (risky), use:")),
          h(Text, { color: "#4AF626" }, "    claude --dangerously-skip-permissions -p")
        )
      : null
  );
}
