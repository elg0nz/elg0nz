import React, { useState, useEffect } from "react";
import { render, Box, Text, useApp } from "ink";

const h = React.createElement;

// ── Neuro Shader (ASCII port) ──────────────────────────────────────────
const CHARS = " .:-=+*#%@";
const WIDTH = 52;
const HEIGHT = 12;
const FRAMES = 42;
const FRAME_MS = 60;

const palette = {
  base: "#1e1e2e",
  blue: "#89b4fa",
  lavender: "#b4befe",
  text: "#cdd6f4",
  orange: "#FF8C00",
  green: "#4AF626",
};

function rot2(x, y, a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c * x - s * y, s * x + c * y];
}

function neuroShape(ux, uy, t) {
  let sax = 0, say = 0, rx = 0, ry = 0;
  let scale = 8.0;
  let uvx = ux, uvy = uy;
  for (let j = 0; j < 8; j++) {
    [uvx, uvy] = rot2(uvx, uvy, 1.0);
    [sax, say] = rot2(sax, say, 1.0);
    const lx = uvx * scale + j + sax - t;
    const ly = uvy * scale + j + say - t;
    sax += Math.sin(lx);
    say += Math.sin(ly);
    rx += (0.5 + 0.5 * Math.cos(lx)) / scale;
    ry += (0.5 + 0.5 * Math.cos(ly)) / scale;
    scale *= 1.2;
  }
  return rx + ry;
}

function computeShaderLine(y, t) {
  const segments = [];
  let currentColor = null;
  let currentChars = "";
  for (let x = 0; x < WIDTH; x++) {
    const ux = ((x / WIDTH - 0.5) * 2.0 * WIDTH) / HEIGHT;
    const uy = (y / HEIGHT - 0.5) * 2.0;
    let noise = neuroShape(ux * 0.7, uy * 0.7, t);
    noise = 1.1 * Math.pow(noise, 2.0);
    noise = Math.pow(noise, 1.2);
    noise = Math.min(1.0, noise);
    const idx = Math.floor(noise * (CHARS.length - 1));
    const ch = CHARS[idx];
    const color =
      noise < 0.25 ? palette.base
      : noise < 0.5 ? palette.blue
      : noise < 0.75 ? palette.lavender
      : palette.text;
    if (color !== currentColor) {
      if (currentChars) segments.push({ color: currentColor, text: currentChars });
      currentColor = color;
      currentChars = ch;
    } else {
      currentChars += ch;
    }
  }
  if (currentChars) segments.push({ color: currentColor, text: currentChars });
  return segments;
}

// ── Cassette Shell ──────────────────────────────────────────────────

const SPOKES_TOP = ["\u256f   \u2572", "\u2500   \u2500", "\u2572   \u256f", " \u2502 \u2502 "];
const SPOKES_BOT = ["\u2572   \u256f", "\u2500   \u2500", "\u256f   \u2572", " \u2502 \u2502 "];

function tapeSlice(frame) {
  const base = "\u2591\u2593".repeat(16);
  return base.slice(frame % 2, (frame % 2) + 6);
}

function ShaderLine({ segments }) {
  return h(
    Text,
    null,
    ...segments.map((s, i) => h(Text, { key: i, color: s.color }, s.text))
  );
}

function CassetteFrame({ frame, shaderLines }) {
  const ri = frame % 4;
  const lt = SPOKES_TOP[ri];
  const lb = SPOKES_BOT[ri];
  const rt = SPOKES_TOP[(ri + 2) % 4];
  const rb = SPOKES_BOT[(ri + 2) % 4];
  const tp = tapeSlice(frame);

  const o = { color: palette.orange, bold: true };
  const d = { dimColor: true };
  const CW = 58;

  function CRow({ children }) {
    return h(
      Text,
      null,
      h(Text, o, "  \u2551"),
      children,
      h(Text, o, "\u2551")
    );
  }

  return h(
    Box,
    { flexDirection: "column" },
    h(Text, null, ""),
    h(Text, o, `  \u2554${"═".repeat(CW)}\u2557`),
    h(CRow, null, h(Text, null, " ".repeat(CW))),
    h(CRow, null,
      h(Text, d, "  \u250c"), h(Text, d, "\u2500".repeat(52)), h(Text, d, "\u2510  ")
    ),
    ...shaderLines.map((segs, i) =>
      h(CRow, { key: `s${i}` },
        h(Text, d, "  \u2502"),
        h(ShaderLine, { segments: segs }),
        h(Text, d, "\u2502  ")
      )
    ),
    h(CRow, null,
      h(Text, d, "  \u2514"), h(Text, d, "\u2500".repeat(52)), h(Text, d, "\u2518  ")
    ),
    h(CRow, null, h(Text, null, " ".repeat(CW))),
    h(CRow, null,
      h(Text, d, "     \u256d\u2500\u2500\u2500\u2500\u2500\u256e "),
      h(Text, { color: palette.green }, tp),
      h(Text, d, "  SIDE A \u00b7 C-\u221e  "),
      h(Text, { color: palette.green }, tp),
      h(Text, d, " \u256d\u2500\u2500\u2500\u2500\u2500\u256e     ")
    ),
    h(CRow, null,
      h(Text, d, "     \u2502"),
      h(Text, { color: palette.green }, lt),
      h(Text, d, "\u2502 "),
      h(Text, { color: palette.green }, tp),
      h(Text, d, "                "),
      h(Text, { color: palette.green }, tp),
      h(Text, d, " \u2502"),
      h(Text, { color: palette.green }, rt),
      h(Text, d, "\u2502     ")
    ),
    h(CRow, null,
      h(Text, d, "     \u2502  "),
      h(Text, { color: "white", bold: true }, "\u25c9"),
      h(Text, d, "  \u2502 "),
      h(Text, { color: palette.green }, tp),
      h(Text, d, "                "),
      h(Text, { color: palette.green }, tp),
      h(Text, d, " \u2502  "),
      h(Text, { color: "white", bold: true }, "\u25c9"),
      h(Text, d, "  \u2502     ")
    ),
    h(CRow, null,
      h(Text, d, "     \u2502"),
      h(Text, { color: palette.green }, lb),
      h(Text, d, "\u2502 "),
      h(Text, { color: palette.green }, tp),
      h(Text, d, "                "),
      h(Text, { color: palette.green }, tp),
      h(Text, d, " \u2502"),
      h(Text, { color: palette.green }, rb),
      h(Text, d, "\u2502     ")
    ),
    h(CRow, null,
      h(Text, d, "     \u2570\u2500\u2500\u2500\u2500\u2500\u256f "),
      h(Text, { color: palette.green }, tp),
      h(Text, d, "                "),
      h(Text, { color: palette.green }, tp),
      h(Text, d, " \u2570\u2500\u2500\u2500\u2500\u2500\u256f     ")
    ),
    h(CRow, null, h(Text, null, " ".repeat(CW))),
    h(CRow, null,
      h(Text, null, "      "),
      h(Text, o, "sanscourier.ai"),
      h(Text, d, "  \u00b7  "),
      h(Text, { color: palette.green }, "\u25b6"),
      h(Text, d, " npx install-glo"),
      h(Text, null, " ".repeat(CW - 46))
    ),
    h(CRow, null, h(Text, null, " ".repeat(CW))),
    h(Text, o, `  \u255a${"═".repeat(CW)}\u255d`),
    h(Text, null, "")
  );
}

// ── Business Card ──────────────────────────────────────────────────────

function BusinessCard() {
  const o = { color: palette.orange };
  const ob = { color: palette.orange, bold: true };
  const g = { color: palette.green };
  const d = { dimColor: true };
  const w = { color: "white" };

  return h(
    Box,
    { borderStyle: "double", borderColor: palette.orange, paddingX: 2, paddingY: 1, marginX: 1, marginY: 1, flexDirection: "column" },
    h(Text, null, ""),
    h(Text, ob, "   Gonzalo \"Glo\" Maldonado"),
    h(Text, w, "   CTO / VP Eng / Technical Co-Founder"),
    h(Text, { dimColor: true, italic: true }, "   Ship value. Say what matters. Measure what counts."),
    h(Text, null, ""),
    h(Text, o, "   \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"),
    h(Text, null, ""),
    h(Text, null, h(Text, w, "   5 exits"), h(Text, d, " including:")),
    h(Text, null, h(Text, g, "     Yammer \u2192 Microsoft"), h(Text, d, "  ($1.2B)")),
    h(Text, g, "     Nextdoor \u2192 IPO"),
    h(Text, null, h(Text, w, "   20+ years"), h(Text, d, " engineering leadership")),
    h(Text, null, h(Text, w, "   Focus: "), h(Text, d, "AI Infrastructure, Distributed Systems")),
    h(Text, null, ""),
    h(Text, o, "   \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"),
    h(Text, null, ""),
    h(Text, null, h(Text, o, "   web"), h(Text, d, "      \u2192 "), h(Text, w, "sanscourier.ai")),
    h(Text, null, h(Text, o, "   book"), h(Text, d, "     \u2192 "), h(Text, w, "intro.co/GonzaloMaldonado")),
    h(Text, null, h(Text, o, "   linkedin"), h(Text, d, " \u2192 "), h(Text, w, "linkedin.com/in/elg0nz")),
    h(Text, null, h(Text, o, "   github"), h(Text, d, "   \u2192 "), h(Text, w, "github.com/elg0nz")),
    h(Text, null, h(Text, o, "   email"), h(Text, d, "    \u2192 "), h(Text, w, "glo@sanscourier.ai")),
    h(Text, null, ""),
    h(Text, o, "   \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"),
    h(Text, null, ""),
    h(Text, null, h(Text, ob, "   Ready to talk? "), h(Text, { color: "white", underline: true }, "intro.co/GonzaloMaldonado")),
    h(Text, null, "")
  );
}

// ── CardApp ────────────────────────────────────────────────────────────

function CardApp() {
  const { exit } = useApp();
  const isTTY = process.stdout.isTTY;
  const [frame, setFrame] = useState(0);
  const [showCard, setShowCard] = useState(!isTTY);

  useEffect(() => {
    if (!isTTY) {
      // Non-TTY: show card immediately, then exit
      const t = setTimeout(() => exit(), 100);
      return () => clearTimeout(t);
    }

    if (frame >= FRAMES) {
      setShowCard(true);
      const t = setTimeout(() => exit(), 200);
      return () => clearTimeout(t);
    }

    const timer = setTimeout(() => setFrame((f) => f + 1), FRAME_MS);
    return () => clearTimeout(timer);
  }, [frame, isTTY]);

  if (showCard) {
    return h(
      Box,
      { flexDirection: "column" },
      h(BusinessCard),
      h(
        Text,
        { dimColor: true },
        "\n  Tip: Run ",
        h(Text, { color: "white" }, "npx install-glo"),
        " anytime to see this card again."
      ),
      h(
        Text,
        { dimColor: true },
        "        Run ",
        h(Text, { color: "white" }, "npx install-glo ai"),
        " to start the GLO Loop.\n"
      )
    );
  }

  // Animate cassette
  const t = (frame / FRAMES) * Math.PI * 2 * 0.8;
  const shaderLines = [];
  for (let y = 0; y < HEIGHT; y++) {
    shaderLines.push(computeShaderLine(y, t));
  }

  return h(CassetteFrame, { frame, shaderLines });
}

// ── Main ───────────────────────────────────────────────────────────────

const app = render(h(CardApp));
app.waitUntilExit().catch(() => process.exit(1));
