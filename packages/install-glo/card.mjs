import chalk from "chalk";
import boxen from "boxen";

// ── Neuro Shader (ASCII port) ──────────────────────────────────────────
// Simplified port of the SansCourier WebGL neuro noise shader.
// Uses the same rotate-and-accumulate-sine algorithm, rendered as
// dithered ASCII characters in Catppuccin Mocha palette.

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

const ob = chalk.hex(palette.orange).bold;
const g = chalk.hex(palette.green);
const d = chalk.dim;
const w = chalk.white;
const wb = chalk.white.bold;

function rot2(x, y, a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c * x - s * y, s * x + c * y];
}

function neuroShape(ux, uy, t) {
  let sax = 0,
    say = 0;
  let rx = 0,
    ry = 0;
  let scale = 8.0;
  let uvx = ux,
    uvy = uy;

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

function renderShader(t) {
  const lines = [];
  for (let y = 0; y < HEIGHT; y++) {
    let line = "";
    for (let x = 0; x < WIDTH; x++) {
      const ux = ((x / WIDTH - 0.5) * 2.0 * WIDTH) / HEIGHT;
      const uy = (y / HEIGHT - 0.5) * 2.0;

      let noise = neuroShape(ux * 0.7, uy * 0.7, t);
      noise = 1.1 * Math.pow(noise, 2.0);
      noise = Math.pow(noise, 1.2);
      noise = Math.min(1.0, noise);

      const idx = Math.floor(noise * (CHARS.length - 1));
      const ch = CHARS[idx];

      if (noise < 0.25) {
        line += chalk.hex(palette.base)(ch);
      } else if (noise < 0.5) {
        line += chalk.hex(palette.blue)(ch);
      } else if (noise < 0.75) {
        line += chalk.hex(palette.lavender)(ch);
      } else {
        line += chalk.hex(palette.text)(ch);
      }
    }
    lines.push(line);
  }
  return lines;
}

// ── Cassette Shell ────────────────────────────────────────────────────

const SPOKES_TOP = ["╱   ╲", "─   ─", "╲   ╱", " │ │ "];
const SPOKES_BOT = ["╲   ╱", "─   ─", "╱   ╲", " │ │ "];

const CW = 58; // cassette inner width

function visLen(s) {
  return s.replace(/\x1b\[[0-9;]*m/g, "").length;
}

function cPad(s, width) {
  return s + " ".repeat(Math.max(0, width - visLen(s)));
}

function cRow(inner) {
  return ob("  ║") + cPad(inner, CW) + ob("║");
}

function buildCassetteFrame(frame, shaderLines) {
  const ri = frame % 4;
  const lt = SPOKES_TOP[ri];
  const lb = SPOKES_BOT[ri];
  const rt = SPOKES_TOP[(ri + 2) % 4];
  const rb = SPOKES_BOT[(ri + 2) % 4];

  // Tape pattern scrolls
  const tapeBase = "░▓".repeat(16);
  const tp = g(tapeBase.slice(frame % 2, (frame % 2) + 6));

  const lines = [];
  lines.push("");
  lines.push(ob(`  ╔${"═".repeat(CW)}╗`));
  lines.push(cRow(""));
  lines.push(
    cRow(
      d("  ┌") + d("─".repeat(52)) + d("┐  ")
    )
  );

  // Embed shader into the label area
  for (const sl of shaderLines) {
    lines.push(cRow(d("  │") + sl + d("│  ")));
  }

  lines.push(
    cRow(
      d("  └") + d("─".repeat(52)) + d("┘  ")
    )
  );
  lines.push(cRow(""));

  // Reels
  lines.push(
    cRow(
      d("     ╭─────╮ ") + tp + d("  SIDE A · C-∞  ") + tp + d(" ╭─────╮     ")
    )
  );
  lines.push(
    cRow(
      d("     │") + g(lt) + d("│ ") + tp + d("                ") + tp + d(" │") + g(rt) + d("│     ")
    )
  );
  lines.push(
    cRow(
      d("     │  ") + wb("◉") + d("  │ ") + tp + d("                ") + tp + d(" │  ") + wb("◉") + d("  │     ")
    )
  );
  lines.push(
    cRow(
      d("     │") + g(lb) + d("│ ") + tp + d("                ") + tp + d(" │") + g(rb) + d("│     ")
    )
  );
  lines.push(
    cRow(
      d("     ╰─────╯ ") + tp + d("                ") + tp + d(" ╰─────╯     ")
    )
  );
  lines.push(cRow(""));
  lines.push(
    cRow(
      "      " +
        ob("sanscourier.ai") +
        d("  ·  ") +
        g("▶") +
        d(" npx install-glo")
    )
  );
  lines.push(cRow(""));
  lines.push(ob(`  ╚${"═".repeat(CW)}╝`));
  lines.push("");

  return lines;
}

// ── Business Card ──────────────────────────────────────────────────────

function buildCard() {
  const c = {
    name: chalk.bold.hex(palette.orange)("   Gonzalo \"Glo\" Maldonado"),
    title: chalk.white("   CTO / VP Eng / Technical Co-Founder"),
    tagline: chalk.dim.italic(
      "   Ship value. Say what matters. Measure what counts."
    ),
    divider: chalk.hex(palette.orange)(
      "   ─────────────────────────────────────"
    ),
    exits: chalk.white("   5 exits") + chalk.dim(" including:"),
    exit1:
      chalk.hex(palette.green)("     Yammer → Microsoft") +
      chalk.dim("  ($1.2B)"),
    exit2: chalk.hex(palette.green)("     Nextdoor → IPO"),
    experience:
      chalk.white("   20+ years") + chalk.dim(" engineering leadership"),
    focus:
      chalk.white("   Focus: ") +
      chalk.dim("AI Infrastructure, Distributed Systems"),
    web:
      chalk.hex(palette.orange)("   web") +
      chalk.dim("      → ") +
      chalk.white("sanscourier.ai"),
    book:
      chalk.hex(palette.orange)("   book") +
      chalk.dim("     → ") +
      chalk.white("intro.co/GonzaloMaldonado"),
    linkedin:
      chalk.hex(palette.orange)("   linkedin") +
      chalk.dim(" → ") +
      chalk.white("linkedin.com/in/elg0nz"),
    github:
      chalk.hex(palette.orange)("   github") +
      chalk.dim("   → ") +
      chalk.white("github.com/elg0nz"),
    email:
      chalk.hex(palette.orange)("   email") +
      chalk.dim("    → ") +
      chalk.white("glo@sanscourier.ai"),
    cta:
      chalk.bold.hex(palette.orange)("   Ready to talk? ") +
      chalk.underline.white("intro.co/GonzaloMaldonado"),
  };

  const card = [
    "",
    c.name,
    c.title,
    c.tagline,
    "",
    c.divider,
    "",
    c.exits,
    c.exit1,
    c.exit2,
    c.experience,
    c.focus,
    "",
    c.divider,
    "",
    c.web,
    c.book,
    c.linkedin,
    c.github,
    c.email,
    "",
    c.divider,
    "",
    c.cta,
    "",
  ].join("\n");

  return boxen(card, {
    padding: 1,
    margin: 1,
    borderStyle: "double",
    borderColor: palette.orange,
  });
}

// ── Main ───────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const isTTY = process.stdout.isTTY;

  if (isTTY) {
    process.stdout.write("\x1B[?25l"); // hide cursor
    process.stdout.write("\x1B[H\x1B[2J"); // clear screen

    let totalLines = 0;

    for (let f = 0; f < FRAMES; f++) {
      const t = (f / FRAMES) * Math.PI * 2 * 0.8;
      const shaderLines = renderShader(t);
      const cassetteLines = buildCassetteFrame(f, shaderLines);

      if (f > 0) {
        process.stdout.write(`\x1b[${totalLines}A`);
      }

      const output = cassetteLines.join("\n") + "\n";
      process.stdout.write(output);
      totalLines = cassetteLines.length;

      await sleep(FRAME_MS);
    }

    process.stdout.write("\x1B[H\x1B[2J"); // clear for card
  }

  console.log(buildCard());
  console.log(
    d(
      "\n  Tip: Run " +
        w("npx install-glo") +
        " anytime to see this card again."
    )
  );
  console.log(
    d(
      "        Run " +
        w("npx install-glo ai") +
        " to start the GLO Loop.\n"
    )
  );

  if (isTTY) {
    process.stdout.write("\x1B[?25h"); // restore cursor
  }
}

main().catch(() => {
  process.stdout.write("\x1B[?25h");
  process.exit(1);
});
