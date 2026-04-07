import React, { useState } from "react";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { Box, Text, useApp } from "ink";
import TextInput from "ink-text-input";

const h = React.createElement;

const STEPS = [
  { key: "name", label: "Loop name", hint: "(e.g. 'Optimize CI suite')", defaultVal: "My GLO Loop" },
  { key: "type", label: "Loop type", hint: "(1 or 2, default: 2)" },
];

// Extra steps are added dynamically based on type selection

export function GloopGenerator({ projectRoot, onComplete }) {
  const { exit } = useApp();
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [extraSteps, setExtraSteps] = useState([]);

  const allSteps = [...STEPS, ...extraSteps];

  const handleSubmit = (value) => {
    const val = value.trim();
    const newAnswers = { ...answers };

    if (step === 0) {
      newAnswers.name = val || "My GLO Loop";
    } else if (step === 1) {
      const typeIdx = parseInt(val, 10);
      newAnswers.type = typeIdx === 1 ? "web-vitals" : "cli-timing";
      // Add extra steps based on type
      if (typeIdx === 1) {
        setExtraSteps([
          { key: "url", label: "Default URL", defaultVal: "http://localhost:3000" },
          { key: "vital", label: "Default vital", defaultVal: "LCP" },
        ]);
      } else {
        setExtraSteps([
          { key: "command", label: "Default command", hint: "(e.g. npm test)" },
          { key: "metric", label: "Default metric", defaultVal: "execution_time" },
        ]);
      }
    } else {
      // Dynamic extra steps
      const extraIdx = step - STEPS.length;
      const extraStep = extraSteps[extraIdx];
      if (extraStep) {
        newAnswers[extraStep.key] = val || extraStep.defaultVal || "";
      }
    }

    setAnswers(newAnswers);
    setInput("");

    const totalSteps = STEPS.length + (step >= 1 ? (newAnswers.type === "web-vitals" ? 2 : 2) : 0);

    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      // Generate the file
      let extraFields = "";
      if (newAnswers.type === "web-vitals") {
        const url = newAnswers.url || "http://localhost:3000";
        const vital = (newAnswers.vital || "LCP").toUpperCase();
        extraFields = `url: ${url}\nvital: ${vital}\n`;
      } else {
        if (newAnswers.command) extraFields = `command: ${newAnswers.command}\n`;
        const metric = newAnswers.metric || "execution_time";
        extraFields += `metric: ${metric}\n`;
      }

      const content = `---\nname: ${newAnswers.name}\ntype: ${newAnswers.type}\n${extraFields}---\n\n# ${newAnswers.name}\n\nCustom GLO Loop configuration for this project.\nAdd any notes about optimization goals here.\n`;

      const filePath = join(projectRoot, "GLOOP.md");
      writeFileSync(filePath, content, "utf8");
      setDone(true);
      if (onComplete) onComplete();
      else setTimeout(() => exit(), 200);
    }
  };

  if (done) {
    return h(
      Box,
      { flexDirection: "column" },
      h(Text, null, ""),
      h(Text, null, h(Text, { color: "#4AF626" }, "  \u2713 Created "), h(Text, { color: "white" }, "GLOOP.md")),
      h(Text, { dimColor: true }, "  Run the GLO Loop again to use it.\n")
    );
  }

  const elems = [];
  elems.push(h(Text, { key: "title", color: "#4AF626" }, "\n  Generate GLOOP.md\n"));
  elems.push(
    h(Text, { key: "desc", dimColor: true },
      "  This will create a GLOOP.md in your project root.\n" +
      "  Next time you run the GLO Loop, it will detect it automatically.\n"
    )
  );

  // Show type options before type step
  if (step >= 1) {
    elems.push(h(Text, { key: "types-header", color: "white" }, "  Available loop types:"));
    elems.push(
      h(Text, { key: "type-1" },
        h(Text, { color: "#4AF626" }, "    1. web-vitals  "),
        h(Text, { dimColor: true }, "\u2014 Lighthouse-based web performance")
      )
    );
    elems.push(
      h(Text, { key: "type-2" },
        h(Text, { color: "#4AF626" }, "    2. cli-timing  "),
        h(Text, { dimColor: true }, "\u2014 CLI command execution time")
      )
    );
    elems.push(h(Text, { key: "types-space" }, ""));
  }

  // Previous answers
  for (let i = 0; i < step; i++) {
    const s = allSteps[i];
    if (!s) break;
    let val = answers[s.key];
    if (s.key === "type") val = val === "web-vitals" ? "1 (web-vitals)" : "2 (cli-timing)";
    elems.push(
      h(Text, { key: `answer-${i}` },
        h(Text, { color: "#FF8C00" }, `  ${s.label}: `),
        h(Text, { color: "white" }, String(val || ""))
      )
    );
  }

  // Current prompt
  const current = allSteps[step];
  if (current) {
    elems.push(
      h(Box, { key: "prompt" },
        h(Text, { color: "#FF8C00" }, `  ${current.label} `),
        h(Text, { dimColor: true }, current.hint || (current.defaultVal ? `(default: ${current.defaultVal})` : "")),
        h(Text, null, ": "),
        h(TextInput, { value: input, onChange: setInput, onSubmit: handleSubmit })
      )
    );
  }

  return h(Box, { flexDirection: "column" }, ...elems);
}
