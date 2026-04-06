import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { VITALS } from "./vitals.mjs";

const h = React.createElement;

const STEPS = [
  { key: "targetUrl", label: "Page URL", defaultVal: "http://localhost:3000" },
  { key: "targetVital", label: "Target vital", defaultVal: "LCP" },
  { key: "maxLoops", label: "Max loops", defaultVal: "10" },
  {
    key: "aiBackend",
    label: "AI backend",
    defaultVal: "Vercel AI",
    hint: "(default: Vercel AI, or CLI e.g. 'claude -p')",
  },
];

export function InputForm({ onComplete }) {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);

  const handleSubmit = (value) => {
    const val = value.trim();
    const newAnswers = { ...answers };

    if (step === 0) {
      newAnswers.targetUrl = val || "http://localhost:3000";
    } else if (step === 1) {
      const vital = (val || "LCP").toUpperCase();
      if (!VITALS[vital]) {
        setError(`Unknown vital: ${vital}. Choose from: ${Object.keys(VITALS).join(", ")}`);
        setInput("");
        return;
      }
      newAnswers.targetVital = vital;
    } else if (step === 2) {
      newAnswers.maxLoops = parseInt(val, 10) || 10;
    } else if (step === 3) {
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
      let route = "/";
      try {
        route = new URL(newAnswers.targetUrl).pathname;
      } catch {}
      onComplete({ ...newAnswers, route });
    }
  };

  const elems = [];

  // Show vitals list before the vital step
  if (step >= 1) {
    elems.push(h(Text, { key: "vitals-header", color: "white" }, "  Available web vitals:"));
    for (const [key, info] of Object.entries(VITALS)) {
      elems.push(
        h(
          Text,
          { key: `vital-${key}` },
          h(Text, { color: "#4AF626" }, `    ${key.padEnd(6)}`),
          h(Text, { dimColor: true }, `${info.name} (good: <${info.good}${info.unit})`)
        )
      );
    }
    elems.push(h(Text, { key: "vitals-spacer" }, ""));
  }

  // Previous answers
  for (let i = 0; i < step; i++) {
    const s = STEPS[i];
    const val =
      s.key === "maxLoops"
        ? String(answers[s.key])
        : s.key === "aiBackend"
          ? answers[s.key] === "sdk"
            ? "Vercel AI SDK"
            : answers[s.key]
          : answers[s.key];
    elems.push(
      h(
        Text,
        { key: `answer-${i}` },
        h(Text, { color: "#FF8C00" }, `  ${s.label}: `),
        h(Text, { color: "white" }, val)
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
      h(Text, { dimColor: true }, `(default: ${current.defaultVal}): `),
      h(TextInput, { value: input, onChange: setInput, onSubmit: handleSubmit })
    )
  );

  return h(Box, { flexDirection: "column" }, ...elems);
}

export function ConfigSummary({ config }) {
  const { targetUrl, targetVital, maxLoops, aiBackend } = config;
  const vitalInfo = VITALS[targetVital];
  return h(
    Box,
    { flexDirection: "column" },
    h(
      Text,
      null,
      h(Text, { color: "#FF8C00" }, "  Target: "),
      h(
        Text,
        { color: "white" },
        `${targetVital} < ${vitalInfo.good}${vitalInfo.unit}`
      ),
      h(Text, { dimColor: true }, ` on ${targetUrl}`)
    ),
    h(
      Text,
      null,
      h(Text, { color: "#FF8C00" }, "  Loops:  "),
      h(Text, { color: "white" }, `${maxLoops} max`)
    ),
    h(
      Text,
      null,
      h(Text, { color: "#FF8C00" }, "  AI:     "),
      h(Text, { color: "white" }, aiBackend === "sdk" ? "Vercel AI SDK" : aiBackend)
    )
  );
}

