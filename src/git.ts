import { execSync } from "node:child_process";

export function execGit(args: string): string {
  return execSync(`git ${args}`, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8"
  });
}

export function isGitInstalled(): boolean {
  try {
    execSync("git --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function isInsideGitRepo(): boolean {
  try {
    execGit("rev-parse --is-inside-work-tree");
    return true;
  } catch {
    return false;
  }
}

export function getStagedDiff(): string | null {
  const content = execGit("diff --staged").trim();
  return content || null;
}

export function getUnstagedDiff(): string | null {
  const content = execGit("diff").trim();
  return content || null;
}
