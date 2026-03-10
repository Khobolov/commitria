#!/usr/bin/env node
import { isGitInstalled, isInsideGitRepo, getStagedDiff, getUnstagedDiff, getCurrentBranch, getBranchCommits } from "./git.js";
import { getProvider } from "./providers/index.js";
import { buildCommitPrompt, buildTicketingPrompt } from "./prompt.js";
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
import { colors } from "./colors.js";
import { parseTicketId, getTitle, saveTitle } from "./ticketing.js";

function printHelp(): void {
  console.log(`
${colors.cyan}${colors.bold}commitria${colors.reset} - AI-powered commit message generator

${colors.yellow}Usage:${colors.reset}
  commitria                     Generate commit message from unstaged changes
  commitria --staged            Use staged changes instead
  commitria --provider <name>   Use specific provider (claude, codex)
  commitria --title <title>     Set task title for ticketing mode
  commitria config              Show current configuration
  commitria config set <k> <v>  Set configuration value
  commitria config get <key>    Get configuration value
  commitria --help              Show this help message
  commitria --version           Show version

${colors.yellow}Options:${colors.reset}
  -s, --staged            Use staged changes (git add) instead of unstaged
  -p, --provider          Specify AI provider (claude, codex)
      --title <title>     Set task title for current branch (ticketing mode)
      --ticketing         Enable ticketing mode for this run

${colors.yellow}Ticketing:${colors.reset}
  When enabled, commits follow the format: TICKET-ID: Task Title
  The ticket ID is extracted from the branch name (e.g., feature/NG-5645).
  Provide the task title once with --title, and it's reused for every commit.

  ${colors.dim}Enable:${colors.reset}   commitria config set ticketing true
  ${colors.dim}Pattern:${colors.reset}  commitria config set ticketPattern "NG-\\d+"

${colors.yellow}Providers:${colors.reset}
  claude    Claude Code CLI (default)
  codex     OpenAI Codex CLI

${colors.yellow}Examples:${colors.reset}
  commitria                                    # Generate from unstaged changes
  commitria -s                                 # Generate from staged changes
  commitria -p codex                           # Use Codex provider
  commitria --title="SW - Events Page"         # Set task title (ticketing)
  commitria config set ticketing true          # Enable ticketing mode
  commitria config set provider codex          # Set default provider
`);
}

function printVersion(): void {
  console.log("commitria v1.0.0");
}

function printConfig(): void {
  const config = loadConfig();
  console.log(`
${colors.cyan}${colors.bold}Configuration:${colors.reset}
  ${colors.dim}Path:${colors.reset}          ${getConfigPath()}
  ${colors.dim}Provider:${colors.reset}      ${colors.green}${config.provider}${colors.reset}
  ${colors.dim}Ticketing:${colors.reset}     ${config.ticketing ? colors.green + "enabled" : colors.yellow + "disabled"}${colors.reset}
  ${colors.dim}Ticket Pattern:${colors.reset} ${colors.green}${config.ticketPattern}${colors.reset}
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
    } else if (key === "ticketing") {
      if (value !== "true" && value !== "false") {
        console.error(`${colors.red}Invalid value. Use: true or false${colors.reset}`);
        process.exit(1);
      }
      setConfigValue("ticketing", value === "true");
      console.log(`${colors.green}Ticketing ${value === "true" ? "enabled" : "disabled"}${colors.reset}`);
    } else if (key === "ticketPattern") {
      setConfigValue("ticketPattern", value);
      console.log(`${colors.green}Ticket pattern set to: ${value}${colors.reset}`);
    } else {
      console.error(`${colors.red}Unknown config key: ${key}${colors.reset}`);
      console.error(`Available keys: provider, ticketing, ticketPattern`);
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

    if (key === "provider" || key === "ticketing" || key === "ticketPattern") {
      console.log(getConfigValue(key));
    } else {
      console.error(`${colors.red}Unknown config key: ${key}${colors.reset}`);
      console.error(`Available keys: provider, ticketing, ticketPattern`);
      process.exit(1);
    }
    return;
  }

  console.error(`${colors.red}Unknown config command: ${subCommand}${colors.reset}`);
  process.exit(1);
}

interface ParsedArgs {
  provider?: Provider;
  staged: boolean;
  title?: string;
  ticketing?: boolean;
  command?: string;
  commandArgs: string[];
}

function parseArgs(args: string[]): ParsedArgs {
  let provider: Provider | undefined;
  let staged = false;
  let title: string | undefined;
  let ticketing: boolean | undefined;
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

    if (arg === "--staged" || arg === "-s") {
      staged = true;
      continue;
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

    if (arg === "--ticketing") {
      ticketing = true;
      continue;
    }

    if (arg.startsWith("--title=")) {
      title = arg.slice("--title=".length);
      continue;
    }

    if (arg === "--title") {
      title = args[++i];
      if (!title) {
        console.error(`${colors.red}Missing value for --title${colors.reset}`);
        process.exit(1);
      }
      continue;
    }

    if (arg === "config") {
      command = "config";
      commandArgs.push(...args.slice(i + 1));
      break;
    }
  }

  return { provider, staged, title, ticketing, command, commandArgs };
}

interface GenerateOptions {
  providerName: Provider;
  useStaged: boolean;
  useTicketing: boolean;
  title?: string;
  ticketPattern: string;
}

async function generateCommit(options: GenerateOptions): Promise<void> {
  const { providerName, useStaged, useTicketing, title, ticketPattern } = options;

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

  // Get diff based on mode
  const diff = useStaged ? getStagedDiff() : getUnstagedDiff();
  if (!diff) {
    if (useStaged) {
      console.error(`${colors.yellow}No staged changes found.${colors.reset}`);
      console.error(`${colors.dim}Stage your changes first: git add <files>${colors.reset}`);
    } else {
      console.error(`${colors.yellow}No unstaged changes found.${colors.reset}`);
    }
    process.exit(1);
  }

  // Build prompt based on mode
  let prompt: string;
  let ticketPrefix = "";

  if (useTicketing) {
    const branch = getCurrentBranch();
    if (!branch) {
      console.error(`${colors.red}Error: Could not determine current branch.${colors.reset}`);
      process.exit(1);
    }

    const ticketId = parseTicketId(branch, ticketPattern);
    if (!ticketId) {
      console.error(`${colors.red}Error: Could not find ticket ID in branch name "${branch}".${colors.reset}`);
      console.error(`${colors.dim}Expected pattern: ${ticketPattern}${colors.reset}`);
      console.error(`${colors.dim}Example branch: feature/NG-1234${colors.reset}`);
      process.exit(1);
    }

    // Resolve task title: --title flag > saved title
    let taskTitle = title;

    if (taskTitle) {
      saveTitle(ticketId, taskTitle);
    } else {
      taskTitle = getTitle(ticketId) ?? undefined;
    }

    if (!taskTitle) {
      console.error(`${colors.red}Error: No task title found for ${ticketId}.${colors.reset}`);
      console.error(`${colors.dim}Set it with: commitria --title="Your task title"${colors.reset}`);
      process.exit(1);
    }

    ticketPrefix = `${ticketId}: ${taskTitle}`;
    const previousCommits = getBranchCommits();

    prompt = buildTicketingPrompt({
      diff,
      ticketId,
      title: taskTitle,
      previousCommits,
    });

    console.log(`${colors.dim}Ticket: ${colors.cyan}${ticketPrefix}${colors.reset}`);
  } else {
    prompt = buildCommitPrompt({ content: diff });
  }

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

  if (useTicketing) {
    console.log(formatCommitMessage(`${ticketPrefix}\n\n${result.output!}`));
  } else {
    console.log(formatCommitMessage(result.output!));
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const { provider, staged, title, ticketing, command, commandArgs } = parseArgs(args);

  // Handle config command
  if (command === "config") {
    handleConfigCommand(commandArgs);
    return;
  }

  // Generate commit
  const config = loadConfig();
  const useTicketing = ticketing ?? config.ticketing;

  await generateCommit({
    providerName: provider ?? config.provider,
    useStaged: staged,
    useTicketing,
    title,
    ticketPattern: config.ticketPattern,
  });
}

main().catch((err: Error) => {
  console.error(`${colors.red}Unexpected error: ${err.message}${colors.reset}`);
  process.exit(1);
});
