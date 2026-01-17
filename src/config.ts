import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type Provider = "claude" | "codex";

export interface Config {
  provider: Provider;
}

const DEFAULT_CONFIG: Config = {
  provider: "claude",
};

const CONFIG_DIR = join(homedir(), ".commitria");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): Config {
  try {
    if (existsSync(CONFIG_FILE)) {
      const data = readFileSync(CONFIG_FILE, "utf8");
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch {
    // Ignore errors, return default
  }
  return { ...DEFAULT_CONFIG };
}

export function saveConfig(config: Config): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
}

export function getConfigValue<K extends keyof Config>(key: K): Config[K] {
  const config = loadConfig();
  return config[key];
}

export function setConfigValue<K extends keyof Config>(key: K, value: Config[K]): void {
  const config = loadConfig();
  config[key] = value;
  saveConfig(config);
}

export function isValidProvider(value: string): value is Provider {
  return ["claude", "codex"].includes(value);
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}
