import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execGit } from "./git.js";

interface TicketStore {
  [ticketId: string]: string;
}

function getStorePath(): string {
  const gitDir = execGit("rev-parse --git-dir").trim();
  return join(gitDir, "commitria.json");
}

function loadStore(): TicketStore {
  try {
    const storePath = getStorePath();
    if (existsSync(storePath)) {
      return JSON.parse(readFileSync(storePath, "utf8"));
    }
  } catch {
    // Ignore errors, return empty store
  }
  return {};
}

function saveStore(store: TicketStore): void {
  writeFileSync(getStorePath(), JSON.stringify(store, null, 2), "utf8");
}

export function parseTicketId(branchName: string, pattern: string): string | null {
  const regex = new RegExp(pattern);
  const match = branchName.match(regex);
  return match ? match[0] : null;
}

export function getTitle(ticketId: string): string | null {
  const store = loadStore();
  return store[ticketId] ?? null;
}

export function saveTitle(ticketId: string, title: string): void {
  const store = loadStore();
  store[ticketId] = title;
  saveStore(store);
}
