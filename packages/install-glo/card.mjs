import chalk from "chalk";
import boxen from "boxen";

// ── Neuro Shader (ASCII port) ──────────────────────────────────────────
// Simplified port of the SansCourier WebGL neuro noise shader.
// Uses the same rotate-and-accumulate-sine algorithm, rendered as
// dithered ASCII characters in Catppuccin Mocha palette.

const CHARS = " .:-=+*#%@";
const WIDTH = 58;
const HEIGHT = 18;
const FRAMES = 42;
const FRAME_MS = 60;

const catppuccin = {
  base: "#1e1e2e",
  blue: "#89b4fa",
  lavender: "#b4befe",
  text: "#cdd6f4",
  orange: "#FF8C00",
};

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

function renderFrame(t) {
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

      // Color based on intensity - blend from base to blue to text
      if (noise < 0.25) {
        line += chalk.hex(catppuccin.base)(ch);
      } else if (noise < 0.5) {
        line += chalk.hex(catppuccin.blue)(ch);
      } else if (noise < 0.75) {
        line += chalk.hex(catppuccin.lavender)(ch);
      } else {
        line += chalk.hex(catppuccin.text)(ch);
      }
    }
    lines.push(line);
  }
  return lines.join("\n");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Business Card ──────────────────────────────────────────────────────

function buildCard() {
  const d = {
    name: chalk.bold.hex("#FF8C00")("   Gonzalo \"Glo\" Maldonado"),
    title: chalk.white("   CTO / VP Eng / Technical Co-Founder"),
    tagline: chalk.dim.italic(
      "   Ship value. Say what matters. Measure what counts."
    ),
    divider: chalk.hex("#FF8C00")(
      "   ─────────────────────────────────────"
    ),
    exits: chalk.white("   5 exits") + chalk.dim(" including:"),
    exit1:
      chalk.hex("#4AF626")("     Yammer → Microsoft") +
      chalk.dim("  ($1.2B)"),
    exit2: chalk.hex("#4AF626")("     Nextdoor → IPO"),
    experience:
      chalk.white("   20+ years") + chalk.dim(" engineering leadership"),
    focus:
      chalk.white("   Focus: ") +
      chalk.dim("AI Infrastructure, Distributed Systems"),
    web:
      chalk.hex("#FF8C00")("   web") +
      chalk.dim("      → ") +
      chalk.white("sanscourier.ai"),
    book:
      chalk.hex("#FF8C00")("   book") +
      chalk.dim("     → ") +
      chalk.white("intro.co/GonzaloMaldonado"),
    linkedin:
      chalk.hex("#FF8C00")("   linkedin") +
      chalk.dim(" → ") +
      chalk.white("linkedin.com/in/elg0nz"),
    github:
      chalk.hex("#FF8C00")("   github") +
      chalk.dim("   → ") +
      chalk.white("github.com/elg0nz"),
    email:
      chalk.hex("#FF8C00")("   email") +
      chalk.dim("    → ") +
      chalk.white("glo@sanscourier.ai"),
    cta:
      chalk.bold.hex("#FF8C00")("   Ready to talk? ") +
      chalk.underline.white("intro.co/GonzaloMaldonado"),
  };

  const card = [
    "",
    d.name,
    d.title,
    d.tagline,
    "",
    d.divider,
    "",
    d.exits,
    d.exit1,
    d.exit2,
    d.experience,
    d.focus,
    "",
    d.divider,
    "",
    d.web,
    d.book,
    d.linkedin,
    d.github,
    d.email,
    "",
    d.divider,
    "",
    d.cta,
    "",
  ].join("\n");

  return boxen(card, {
    padding: 1,
    margin: 1,
    borderStyle: "double",
    borderColor: "#FF8C00",
  });
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  const isTTY = process.stdout.isTTY;

  if (isTTY) {
    // Hide cursor during animation
    process.stdout.write("\x1B[?25l");

    const label = chalk.hex(catppuccin.orange)(
      "  ╔══════════════════════════════════════════════════════════╗"
    );
    const labelBottom = chalk.hex(catppuccin.orange)(
      "  ╚══════════════════════════════════════════════════════════╝"
    );
    const brandText = chalk.bold.hex(catppuccin.orange)(
      "                     sanscourier.ai"
    );

    for (let f = 0; f < FRAMES; f++) {
      const t = (f / FRAMES) * Math.PI * 2 * 0.8;
      const frame = renderFrame(t);

      // Move cursor to top-left and draw
      process.stdout.write("\x1B[H\x1B[2J");
      process.stdout.write("\n");
      process.stdout.write(label + "\n");
      process.stdout.write(frame + "\n");
      process.stdout.write(labelBottom + "\n");
      process.stdout.write(brandText + "\n");

      await sleep(FRAME_MS);
    }

    // Show cursor again
    process.stdout.write("\x1B[?25l");
    process.stdout.write("\x1B[H\x1B[2J");
  }

  console.log(buildCard());
  console.log(
    chalk.dim(
      "\n  Tip: Run " +
        chalk.white("npx install-glo") +
        " anytime to see this card again."
    )
  );
  console.log(
    chalk.dim(
      "        Run " +
        chalk.white("npx install-glo ai") +
        " to chat with an AI that knows Glo.\n"
    )
  );

  // Restore cursor
  if (isTTY) {
    process.stdout.write("\x1B[?25h");
  }
}

main().catch(() => {
  // Restore cursor on error
  process.stdout.write("\x1B[?25h");
  process.exit(1);
});
