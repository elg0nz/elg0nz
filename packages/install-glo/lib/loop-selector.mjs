import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { parseGloopFile, BUILTIN_LOOPS } from "./gloop-config.mjs";

const h = React.createElement;

const o = { color: "#FF8C00" };
const g = { color: "#4AF626" };
const d = { dimColor: true };
const w = { color: "white" };

/**
 * Loop selector Ink component.
 * Detects GLOOP.md, shows track listing, and calls onSelect with the chosen loop.
 */
export function LoopSelector({ projectRoot, onSelect, deps }) {
  const [gloopConfig] = useState(() => parseGloopFile(projectRoot, deps));
  const [phase, setPhase] = useState(gloopConfig ? "gloop-ask" : "tracks");
  const [input, setInput] = useState("");

  const handleGloopAnswer = (value) => {
    const answer = value.trim().toLowerCase();
    if (answer === "y" || answer === "") {
      onSelect({
        type: gloopConfig.frontmatter.type || "custom",
        config: gloopConfig.frontmatter,
        body: gloopConfig.body,
        source: "gloop-file",
      });
    } else {
      setInput("");
      setPhase("tracks");
    }
  };

  const handleTrackChoice = (value) => {
    const idx = parseInt(value.trim(), 10) - 1;
    const selected = BUILTIN_LOOPS[idx] || BUILTIN_LOOPS[0];
    onSelect({
      type: selected.type,
      config: {},
      body: "",
      source: "builtin",
    });
  };

  const elems = [];

  if (phase === "gloop-ask") {
    const name = gloopConfig.frontmatter.name || "Custom GLO Loop";
    elems.push(
      h(
        Text,
        { key: "gloop-detect" },
        h(Text, g, "  \u25b6 GLOOP.md detected"),
        h(Text, d, " \u2014 "),
        h(Text, w, `"${name}"`)
      )
    );
    elems.push(h(Text, { key: "gloop-space" }, ""));
    elems.push(
      h(
        Box,
        { key: "gloop-prompt" },
        h(Text, o, "  Play this tape? "),
        h(Text, d, "[y = play / n = browse tracks]: "),
        h(TextInput, { value: input, onChange: setInput, onSubmit: handleGloopAnswer })
      )
    );
    return h(Box, { flexDirection: "column" }, ...elems);
  }

  // Track listing
  elems.push(
    h(
      Text,
      { key: "tracks-header" },
      h(Text, d, "  \u250c\u2500 "),
      h(Text, o, "TRACKS"),
      h(Text, d, " \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510")
    )
  );
  elems.push(
    h(Text, { key: "tracks-gap1" }, h(Text, d, "  \u2502"), h(Text, null, " ".repeat(53)), h(Text, d, "\u2502"))
  );

  for (let i = 0; i < BUILTIN_LOOPS.length; i++) {
    const loop = BUILTIN_LOOPS[i];
    const trackNum = `A${i + 1}`;
    elems.push(
      h(
        Text,
        { key: `track-${i}` },
        h(Text, d, "  \u2502"),
        h(Text, g, `   ${trackNum} \u25b8 `),
        h(Text, w, loop.name),
        h(Text, null, " ".repeat(Math.max(1, 44 - loop.name.length - trackNum.length))),
        h(Text, d, "\u2502")
      )
    );
    elems.push(
      h(
        Text,
        { key: `track-desc-${i}` },
        h(Text, d, "  \u2502"),
        h(Text, d, `        ${loop.description}`),
        h(Text, null, " ".repeat(Math.max(1, 46 - loop.description.length))),
        h(Text, d, "\u2502")
      )
    );
    elems.push(
      h(Text, { key: `track-gap-${i}` }, h(Text, d, "  \u2502"), h(Text, null, " ".repeat(53)), h(Text, d, "\u2502"))
    );
  }

  elems.push(
    h(
      Text,
      { key: "tracks-more" },
      h(Text, d, "  \u2502"),
      h(Text, d, "   \u00b7\u00b7\u00b7 more tracks coming soon"),
      h(Text, null, " ".repeat(23)),
      h(Text, d, "\u2502")
    )
  );
  elems.push(
    h(Text, { key: "tracks-gap2" }, h(Text, d, "  \u2502"), h(Text, null, " ".repeat(53)), h(Text, d, "\u2502"))
  );
  elems.push(
    h(
      Text,
      { key: "tracks-gloop-hint" },
      h(Text, d, "  \u2502"),
      h(Text, d, "   "),
      h(Text, g, "+"),
      h(Text, d, " Drop a "),
      h(Text, w, "GLOOP.md"),
      h(Text, d, " in your repo to add your own"),
      h(Text, null, " ".repeat(6)),
      h(Text, d, "\u2502")
    )
  );
  elems.push(
    h(Text, { key: "tracks-gap3" }, h(Text, d, "  \u2502"), h(Text, null, " ".repeat(53)), h(Text, d, "\u2502"))
  );
  elems.push(
    h(Text, { key: "tracks-footer" }, h(Text, d, "  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518"))
  );
  elems.push(h(Text, { key: "tracks-space" }, ""));
  elems.push(
    h(
      Box,
      { key: "track-prompt" },
      h(Text, o, "  Select track "),
      h(Text, d, `(1-${BUILTIN_LOOPS.length}, default: 1): `),
      h(TextInput, { value: input, onChange: setInput, onSubmit: handleTrackChoice })
    )
  );

  return h(Box, { flexDirection: "column" }, ...elems);
}
