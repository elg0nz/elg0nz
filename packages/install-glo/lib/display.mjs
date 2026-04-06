import React from "react";
import { Text, Box } from "ink";
import { VITALS } from "./vitals.mjs";

const h = React.createElement;

export function Banner() {
  const o = { color: "#FF8C00", bold: true };
  return h(
    Box,
    { flexDirection: "column" },
    h(Text, o, "  \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510"),
    h(
      Text,
      null,
      h(Text, o, "  \u2502"),
      h(Text, o, "             T H E   G L O   L O O P    "),
      h(Text, o, "\u2502")
    ),
    h(
      Text,
      null,
      h(Text, o, "  \u2502"),
      h(Text, { dimColor: true }, "   Web Vitals Optimization Engine            "),
      h(Text, o, "\u2502")
    ),
    h(Text, o, "  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518")
  );
}

export function VitalLine({ vitalKey, value }) {
  const info = VITALS[vitalKey];
  if (!info || value === undefined || value === null) return null;
  const passed = value <= info.good;
  const formatted =
    info.unit === "ms" ? `${Math.round(value)}ms` : value.toFixed(3);
  const color = passed ? "green" : "red";
  const icon = passed ? "\u2713" : "\u2717";
  return h(
    Text,
    null,
    h(Text, { color: "white" }, `    ${vitalKey.padEnd(6)}`),
    h(Text, { color }, formatted.padStart(9)),
    h(Text, { dimColor: true }, `  (good: <${info.good}${info.unit}) `),
    h(Text, { color }, icon)
  );
}

export function ScoreDisplay({ score }) {
  const color = score >= 90 ? "green" : score >= 50 ? "yellow" : "red";
  return h(
    Text,
    null,
    h(Text, { color: "white" }, "    Score   "),
    h(Text, { color, bold: true }, `${score}/100`)
  );
}

export function SuggestionDisplay({ suggestion }) {
  const lines = suggestion.split("\n");
  return h(
    Box,
    { flexDirection: "column" },
    ...lines.map((line, i) => {
      if (
        line.startsWith("DIAGNOSIS:") ||
        line.startsWith("FILE:") ||
        line.startsWith("LINE:") ||
        line.startsWith("WHY:")
      ) {
        const [label, ...rest] = line.split(":");
        return h(
          Text,
          { key: i },
          h(Text, { color: "#FF8C00" }, `    ${label}:`),
          h(Text, { color: "white" }, rest.join(":"))
        );
      } else if (line.startsWith("BEFORE:") || line.startsWith("AFTER:")) {
        return h(Text, { key: i, color: "#FF8C00" }, `    ${line}`);
      }
      return h(Text, { key: i, color: "#89b4fa" }, `    ${line}`);
    })
  );
}
