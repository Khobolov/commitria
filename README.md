<p align="center">
  <img src="https://img.shields.io/npm/v/commitria?color=blue&label=npm" alt="npm version" />
  <img src="https://img.shields.io/node/v/commitria?color=green" alt="node version" />
  <img src="https://img.shields.io/npm/l/commitria" alt="license" />
</p>

<h1 align="center">commitria</h1>

<p align="center">
  <b>Hey commitria, craft me a commit!</b>
</p>

<p align="center">
  <i>Let AI write your commit messages while you focus on code.</i>
</p>

```
$ commitria

⠹ Generating commit message...

Title:
  feat(auth): add user authentication system

Description:
  Implement JWT-based authentication with login and logout endpoints.

  - Add AuthService with JWT token generation
  - Create login/logout API endpoints
  - Add authentication middleware
```

---

## Why commitria?

**Already have a Claude or ChatGPT subscription?** Use what you have!

Most commit message generators require separate API keys and charge per request. With commitria, if you already have:

- **Claude** (Pro, Max) → Use Claude Code CLI
- **ChatGPT** (Plus, Pro) → Use Codex CLI (coming soon)

You get commit message generation at **no additional cost**.

### Features

- **Zero config** - Just run `commitria` in your repo
- **No API keys** - Uses your existing CLI authentication
- **No extra costs** - Leverage your existing subscription
- **Multi-provider** - Switch between Claude, Codex, and more
- **Conventional Commits** - Always follows the standard
- **Smart detection** - Prefers staged changes, falls back to unstaged
- **Beautiful output** - Colored, formatted, ready to use
- **Cross-platform** - Works on Windows, macOS, and Linux

---

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20.0.0
- [Git](https://git-scm.com/)
- One of the supported AI providers:
  - [Claude Code CLI](https://claude.ai/code) (default)
  - [OpenAI Codex CLI](https://openai.com/codex)

---

## Installation

```bash
npm install -g commitria
```

Or run directly without installing:

```bash
npx commitria
```

---

## Usage

```bash
cd your-project
commitria
```

That's it. No flags, no options, no complexity.

---

## Commands

| Command | Description |
|---------|-------------|
| `commitria` | Generate commit message |
| `commitria --provider <name>` | Use specific provider |
| `commitria -p <name>` | Short form of --provider |
| `commitria config` | Show current configuration |
| `commitria config set <key> <value>` | Set configuration value |
| `commitria config get <key>` | Get configuration value |
| `commitria --help` | Show help message |
| `commitria --version` | Show version |

---

## Providers

| Provider | CLI Required | Status |
|----------|--------------|--------|
| `claude` | [Claude Code](https://claude.ai/code) | Default |
| `codex` | [OpenAI Codex](https://openai.com/codex) | Coming Soon |

### Switch Provider

```bash
# Use for single run
commitria -p codex

# Set as default
commitria config set provider codex
```

---

## Configuration

Config file location: `~/.commitria/config.json`

```bash
# View current config
commitria config

# Output:
# Configuration:
#   Path:     ~/.commitria/config.json
#   Provider: claude
```

### Available Options

| Key | Values | Default |
|-----|--------|---------|
| `provider` | `claude`, `codex` | `claude` |

---

## Commit Format

Uses [Conventional Commits](https://www.conventionalcommits.org/) standard:

```
type(scope): subject

body (optional)
```

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |

---

## License

MIT
