import chalk from "chalk";

const o = chalk.hex("#FF8C00");
const ob = chalk.hex("#FF8C00").bold;
const g = chalk.hex("#4AF626");
const d = chalk.dim;
const w = chalk.white;
const wb = chalk.white.bold;

// Strip ANSI escape codes to get visible character count
function visLen(s) {
  return s.replace(/\x1b\[[0-9;]*m/g, "").length;
}

// Pad string to width, accounting for ANSI codes
function pad(s, width) {
  return s + " ".repeat(Math.max(0, width - visLen(s)));
}

const W = 55;

function R(inner) {
  return ob("  ║") + pad(inner, W) + ob("║");
}

// Reel spoke patterns — 4 rotation frames
// Each is 5 chars wide to fit inside │.....│
const SPOKES_TOP = ["╱   ╲", "─   ─", "╲   ╱", " │ │ "];
const SPOKES_BOT = ["╲   ╱", "─   ─", "╱   ╲", " │ │ "];

function tapePattern(frame, len) {
  const base = "░▓".repeat(Math.ceil(len / 2) + 1);
  return base.slice(frame % 2, (frame % 2) + len);
}

function buildCassette(frame) {
  const ri = frame % 4;

  // Left reel
  const lt = SPOKES_TOP[ri];
  const lb = SPOKES_BOT[ri];

  // Right reel spins opposite
  const rt = SPOKES_TOP[(ri + 2) % 4];
  const rb = SPOKES_BOT[(ri + 2) % 4];

  const tp = g(tapePattern(frame, 24));
  const sp = " ".repeat(24);

  return [
    "",
    ob(`  ╔${"═".repeat(W)}╗`),
    R(""),
    R(d("    ┌") + d("─".repeat(45)) + d("┐    ")),
    R(
      d("    │") +
        ob("         T H E   G L O   L O O P          ") +
        d("│    ")
    ),
    R(d("    │") + d("       AI-Powered Optimization Engine      ") + d("│    ")),
    R(d("    └") + d("─".repeat(45)) + d("┘    ")),
    R(""),
    R(d("       ╭─────╮ ") + d(sp) + d(" ╭─────╮       ")),
    R(d("       │") + g(lt) + d("│ ") + tp + d(" │") + g(rt) + d("│       ")),
    R(d("       │  ") + wb("◉") + d("  │ ") + tp + d(" │  ") + wb("◉") + d("  │       ")),
    R(d("       │") + g(lb) + d("│ ") + tp + d(" │") + g(rb) + d("│       ")),
    R(d("       ╰─────╯ ") + d(sp) + d(" ╰─────╯       ")),
    R(""),
    R(
      "     " +
        g("G") + d("·ather → ") +
        g("L") + d("·everage → ") +
        g("O") + d("·perate → ") +
        g("↻") + d("·loop")
    ),
    R(""),
    ob(`  ╚${"═".repeat(W)}╝`),
    "",
  ];
}

const CASSETTE_LINES = buildCassette(0).length;

/**
 * Animate the cassette tape banner with spinning reels.
 * Returns a Promise that resolves when the animation completes.
 */
export function animateCassette({ frames = 20, interval = 100 } = {}) {
  return new Promise((resolve) => {
    let frame = 0;

    // Draw initial frame
    const initial = buildCassette(0);
    process.stdout.write(initial.join("\n") + "\n");

    const timer = setInterval(() => {
      frame++;
      if (frame >= frames) {
        clearInterval(timer);
        // Redraw final static frame
        process.stdout.write(`\x1b[${CASSETTE_LINES}A`);
        const finalFrame = buildCassette(frame);
        process.stdout.write(finalFrame.join("\n") + "\n");
        resolve();
        return;
      }

      // Move cursor up and redraw
      process.stdout.write(`\x1b[${CASSETTE_LINES}A`);
      const lines = buildCassette(frame);
      process.stdout.write(lines.join("\n") + "\n");
    }, interval);
  });
}

/**
 * Print the cassette without animation (fallback for non-TTY).
 */
export function printCassette() {
  const lines = buildCassette(0);
  console.log(lines.join("\n"));
}
