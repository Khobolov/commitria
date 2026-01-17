// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

export function formatCommitMessage(raw: string): string {
  const lines = raw.trim().split("\n");
  const output: string[] = [];

  // First line is always the title
  const title = lines[0] || "";
  output.push("");
  output.push(`${colors.cyan}${colors.bold}Title:${colors.reset}`);
  output.push(`  ${colors.green}${title}${colors.reset}`);

  // Rest is description (if exists)
  if (lines.length > 1) {
    const descriptionLines = lines.slice(1).filter((line) => line.trim() !== "" || lines.indexOf(line) > 1);

    if (descriptionLines.length > 0) {
      output.push("");
      output.push(`${colors.cyan}${colors.bold}Description:${colors.reset}`);

      for (const line of descriptionLines) {
        if (line.trim() === "") {
          output.push("");
        } else if (line.trim().startsWith("-")) {
          // Bullet points
          output.push(`  ${colors.yellow}${line.trim()}${colors.reset}`);
        } else {
          output.push(`  ${colors.white}${line.trim()}${colors.reset}`);
        }
      }
    }
  }

  output.push("");
  return output.join("\n");
}
