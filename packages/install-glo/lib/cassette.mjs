import React, { useState, useEffect } from "react";
import { Text, Box } from "ink";

const h = React.createElement;

const palette = {
  orange: "#FF8C00",
  green: "#4AF626",
};

const o = { color: palette.orange };
const ob = { color: palette.orange, bold: true };
const g = { color: palette.green };
const d = { dimColor: true };
const wb = { color: "white", bold: true };

const W = 55;

const SPOKES_TOP = ["\u256f   \u2572", "\u2500   \u2500", "\u2572   \u256f", " \u2502 \u2502 "];
const SPOKES_BOT = ["\u2572   \u256f", "\u2500   \u2500", "\u256f   \u2572", " \u2502 \u2502 "];

function tapePattern(frame, len) {
  const base = "\u2591\u2593".repeat(Math.ceil(len / 2) + 1);
  return base.slice(frame % 2, (frame % 2) + len);
}

function CRow({ children }) {
  return h(
    Text,
    null,
    h(Text, ob, "  \u2551"),
    children,
    h(Text, ob, "\u2551")
  );
}

function padText(width) {
  return h(Text, null, " ".repeat(width));
}

function CassetteFrame({ frame }) {
  const ri = frame % 4;
  const lt = SPOKES_TOP[ri];
  const lb = SPOKES_BOT[ri];
  const rt = SPOKES_TOP[(ri + 2) % 4];
  const rb = SPOKES_BOT[(ri + 2) % 4];
  const tp = tapePattern(frame, 24);
  const sp = " ".repeat(24);

  return h(
    Box,
    { flexDirection: "column" },
    h(Text, null, ""),
    h(Text, ob, `  \u2554${"═".repeat(W)}\u2557`),
    h(CRow, null, padText(W)),
    h(CRow, null, h(Text, d, "    \u250c"), h(Text, d, "\u2500".repeat(45)), h(Text, d, "\u2510    ")),
    h(CRow, null,
      h(Text, d, "    \u2502"),
      h(Text, ob, "         T H E   G L O   L O O P          "),
      h(Text, d, "\u2502    ")
    ),
    h(CRow, null,
      h(Text, d, "    \u2502"),
      h(Text, d, "       AI-Powered Optimization Engine      "),
      h(Text, d, "\u2502    ")
    ),
    h(CRow, null, h(Text, d, "    \u2514"), h(Text, d, "\u2500".repeat(45)), h(Text, d, "\u2518    ")),
    h(CRow, null, padText(W)),
    h(CRow, null,
      h(Text, d, "       \u256d\u2500\u2500\u2500\u2500\u2500\u256e "),
      h(Text, d, sp),
      h(Text, d, " \u256d\u2500\u2500\u2500\u2500\u2500\u256e       ")
    ),
    h(CRow, null,
      h(Text, d, "       \u2502"),
      h(Text, g, lt),
      h(Text, d, "\u2502 "),
      h(Text, g, tp),
      h(Text, d, " \u2502"),
      h(Text, g, rt),
      h(Text, d, "\u2502       ")
    ),
    h(CRow, null,
      h(Text, d, "       \u2502  "),
      h(Text, wb, "\u25c9"),
      h(Text, d, "  \u2502 "),
      h(Text, g, tp),
      h(Text, d, " \u2502  "),
      h(Text, wb, "\u25c9"),
      h(Text, d, "  \u2502       ")
    ),
    h(CRow, null,
      h(Text, d, "       \u2502"),
      h(Text, g, lb),
      h(Text, d, "\u2502 "),
      h(Text, g, tp),
      h(Text, d, " \u2502"),
      h(Text, g, rb),
      h(Text, d, "\u2502       ")
    ),
    h(CRow, null,
      h(Text, d, "       \u2570\u2500\u2500\u2500\u2500\u2500\u256f "),
      h(Text, d, sp),
      h(Text, d, " \u2570\u2500\u2500\u2500\u2500\u2500\u256f       ")
    ),
    h(CRow, null, padText(W)),
    h(CRow, null,
      h(Text, null, "     "),
      h(Text, g, "G"),
      h(Text, d, "\u00b7ather \u2192 "),
      h(Text, g, "L"),
      h(Text, d, "\u00b7everage \u2192 "),
      h(Text, g, "O"),
      h(Text, d, "\u00b7perate \u2192 "),
      h(Text, g, "\u21bb"),
      h(Text, d, "\u00b7loop"),
      h(Text, null, " ".repeat(W - 50))
    ),
    h(CRow, null, padText(W)),
    h(Text, ob, `  \u255a${"═".repeat(W)}\u255d`),
    h(Text, null, "")
  );
}

/**
 * Animated cassette tape banner Ink component.
 * Calls onComplete when animation finishes.
 */
export function CassetteAnimation({ frames = 20, interval = 100, onComplete }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (frame >= frames) {
      if (onComplete) onComplete();
      return;
    }
    const timer = setTimeout(() => setFrame((f) => f + 1), interval);
    return () => clearTimeout(timer);
  }, [frame, frames, interval]);

  return h(CassetteFrame, { frame });
}

/**
 * Static cassette (no animation).
 */
export function CassetteStatic() {
  return h(CassetteFrame, { frame: 0 });
}
