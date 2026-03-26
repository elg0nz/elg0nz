import chalk from "chalk";
import { VITALS } from "./vitals.mjs";

export function formatVital(key, value) {
  const info = VITALS[key];
  if (!info || value === undefined || value === null) return null;
  const passed = value <= info.good;
  const formatted =
    info.unit === "ms" ? `${Math.round(value)}ms` : value.toFixed(3);
  const icon = passed ? chalk.green("✓") : chalk.red("✗");
  const color = passed ? chalk.green : chalk.red;
  return (
    `    ${chalk.white(key.padEnd(6))}` +
    `${color(formatted.padStart(9))}` +
    `  ${chalk.dim(`(good: <${info.good}${info.unit})`)} ${icon}`
  );
}

export function printScore(score) {
  const colored =
    score >= 90
      ? chalk.green(`${score}/100`)
      : score >= 50
        ? chalk.yellow(`${score}/100`)
        : chalk.red(`${score}/100`);
  console.log(chalk.white(`    Score   `) + chalk.bold(colored));
}

export function printSuggestion(suggestion) {
  for (const line of suggestion.split("\n")) {
    if (
      line.startsWith("DIAGNOSIS:") ||
      line.startsWith("FILE:") ||
      line.startsWith("LINE:") ||
      line.startsWith("WHY:")
    ) {
      const [label, ...rest] = line.split(":");
      console.log(
        chalk.hex("#FF8C00")(`    ${label}:`) +
          chalk.white(rest.join(":"))
      );
    } else if (line.startsWith("BEFORE:") || line.startsWith("AFTER:")) {
      console.log(chalk.hex("#FF8C00")(`    ${line}`));
    } else {
      console.log(chalk.hex("#89b4fa")(`    ${line}`));
    }
  }
}
