#!/usr/bin/env node
import { isGitInstalled, isInsideGitRepo, getGitDiff } from "./git.js";
import { getProvider } from "./providers/index.js";
import { buildCommitPrompt } from "./prompt.js";
import { Spinner } from "./spinner.js";
import { formatCommitMessage } from "./format.js";
import {
  loadConfig,
  setConfigValue,
  getConfigValue,
  isValidProvider,
  getConfigPath,
  type Provider,
} from "./config.js";

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

function printHelp(): void {
  console.log(`
${colors.cyan}${colors.bold}commitria${colors.reset} - AI-powered commit message generator

${colors.yellow}Usage:${colors.reset}
  commitria                     Generate commit message
  commitria --provider <name>   Use specific provider (claude, codex)
  commitria config              Show current configuration
  commitria config set <k> <v>  Set configuration value
  commitria config get <key>    Get configuration value
  commitria --help              Show this help message
  commitria --version           Show version

${colors.yellow}Providers:${colors.reset}
  claude    Claude Code CLI (default)
  codex     OpenAI Codex CLI

${colors.yellow}Examples:${colors.reset}
  commitria                        # Use default provider
  commitria -p codex               # Use Codex for this run
  commitria config set provider codex   # Set default to Codex
`);
}

function printVersion(): void {
  console.log("commitria v1.0.0");
}

function printConfig(): void {
  const config = loadConfig();
  console.log(`
${colors.cyan}${colors.bold}Configuration:${colors.reset}
  ${colors.dim}Path:${colors.reset}     ${getConfigPath()}
  ${colors.dim}Provider:${colors.reset} ${colors.green}${config.provider}${colors.reset}
`);
}

function handleConfigCommand(args: string[]): void {
  const subCommand = args[0];

  if (!subCommand) {
    printConfig();
    return;
  }

  if (subCommand === "set") {
    const key = args[1];
    const value = args[2];

    if (!key || !value) {
      console.error(`${colors.red}Usage: commitria config set <key> <value>${colors.reset}`);
      process.exit(1);
    }

    if (key === "provider") {
      if (!isValidProvider(value)) {
        console.error(`${colors.red}Invalid provider: ${value}${colors.reset}`);
        console.error(`Available providers: claude, codex`);
        process.exit(1);
      }
      setConfigValue("provider", value);
      console.log(`${colors.green}Provider set to: ${value}${colors.reset}`);
    } else {
      console.error(`${colors.red}Unknown config key: ${key}${colors.reset}`);
      process.exit(1);
    }
    return;
  }

  if (subCommand === "get") {
    const key = args[1];

    if (!key) {
      console.error(`${colors.red}Usage: commitria config get <key>${colors.reset}`);
      process.exit(1);
    }

    if (key === "provider") {
      console.log(getConfigValue("provider"));
    } else {
      console.error(`${colors.red}Unknown config key: ${key}${colors.reset}`);
      process.exit(1);
    }
    return;
  }

  console.error(`${colors.red}Unknown config command: ${subCommand}${colors.reset}`);
  process.exit(1);
}

function parseArgs(args: string[]): { provider?: Provider; command?: string; commandArgs: string[] } {
  let provider: Provider | undefined;
  let command: string | undefined;
  const commandArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--version" || arg === "-v") {
      printVersion();
      process.exit(0);
    }

    if (arg === "--provider" || arg === "-p") {
      const value = args[++i];
      if (!value || !isValidProvider(value)) {
        console.error(`${colors.red}Invalid provider. Available: claude, codex${colors.reset}`);
        process.exit(1);
      }
      provider = value;
      continue;
    }

    if (arg === "config") {
      command = "config";
      commandArgs.push(...args.slice(i + 1));
      break;
    }
  }

  return { provider, command, commandArgs };
}

async function generateCommit(providerName: Provider): Promise<void> {
  // Check prerequisites
  if (!isGitInstalled()) {
    console.error(`${colors.red}Error: git not found. Please install git first.${colors.reset}`);
    process.exit(1);
  }

  const provider = getProvider(providerName);

  if (!provider.isAvailable()) {
    console.error(`${colors.red}Error: ${providerName} CLI not found.${colors.reset}`);
    if (providerName === "claude") {
      console.error(`Install Claude Code: https://claude.ai/code`);
    } else if (providerName === "codex") {
      console.error(`Install Codex CLI: https://openai.com/codex`);
    }
    process.exit(1);
  }

  if (!isInsideGitRepo()) {
    console.error(`${colors.red}Error: Not inside a git repository.${colors.reset}`);
    process.exit(1);
  }

  // Get diff
  const diff = getGitDiff();
  if (!diff) {
    console.error(`${colors.yellow}No changes found (staged or unstaged).${colors.reset}`);
    process.exit(1);
  }

  // Build prompt and run provider
  const prompt = buildCommitPrompt(diff);

  const spinner = new Spinner("Generating commit message...");
  spinner.start();

  const result = await provider.generate(prompt);

  if (!result.success) {
    spinner.stop();
    console.error(`${colors.red}Failed to generate commit message:${colors.reset}`);
    console.error(result.error);
    if (result.exitCode !== undefined) {
      console.error(`Exit code: ${result.exitCode}`);
    }
    process.exit(1);
  }

  spinner.stop();
  console.log(formatCommitMessage(result.output!));
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const { provider, command, commandArgs } = parseArgs(args);

  // Handle config command
  if (command === "config") {
    handleConfigCommand(commandArgs);
    return;
  }

  // Generate commit
  const selectedProvider = provider ?? getConfigValue("provider");
  await generateCommit(selectedProvider);
}

main().catch((err: Error) => {
  console.error(`${colors.red}Unexpected error: ${err.message}${colors.reset}`);
  process.exit(1);
});
