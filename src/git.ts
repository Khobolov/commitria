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

export interface GitDiff {
  content: string;
  mode: "staged" | "unstaged";
}

export function getGitDiff(): GitDiff | null {
  // Prefer staged changes
  let content = execGit("diff --staged").trim();
  if (content) {
    return { content, mode: "staged" };
  }

  // Fall back to unstaged changes
  content = execGit("diff").trim();
  if (content) {
    return { content, mode: "unstaged" };
  }

  return null;
}
