# ClawGuard

> AI Agent Security Companion — Defend, Audit, Update

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-372%20passing-brightgreen)]()
[![Node](https://img.shields.io/badge/node-%3E%3D20-green)]()

[日本語版はこちら](README.ja.md)

## What is ClawGuard?

ClawGuard is a real-time security layer for AI coding agents. It intercepts tool calls (shell commands, file writes, network access) before execution, evaluates risk using policy rules, and returns allow/confirm/deny decisions — all in under 100ms.

It works across AI agent platforms: Claude Code, Codex, MCP, and any agent supporting hook-based interception. The community intelligence network aggregates anonymized decision data, making risk evaluation smarter as more developers use it.

ClawGuard doesn't promise "complete security." It reduces probability of damage, limits blast radius, and makes every AI agent session auditable and replayable.

## Quick Start

```bash
# Install
npm install -g claw-guard

# Initialize (sets up hooks for your AI agent)
claw-guard init

# Verify installation
claw-guard test
```

## How It Works

```
AI Agent Tool Call
    │
    ▼
┌─────────────┐
│  ClawGuard   │
│  Hook Layer  │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────┐
│   Policy     │────▶│  Rules   │  12 core + community
│   Engine     │     └──────────┘
└──────┬──────┘
       │
   ┌───┼───┐
   ▼   ▼   ▼
 allow confirm deny
       │
       ▼
  ExplainRisk
  (data-backed reason)
```

## Architecture

### 2-Layer Design

**Layer 1 — Runtime Defense** (hooks-based, no Docker required)
- Adapter → Policy Engine → allow/confirm/deny
- Community reputation data in confirm dialogs
- Cross-agent decision memory (SQLite)
- Security Passport for compliance proof

**Layer 2 — Infrastructure Isolation** (Docker, Pro/Max)
- 3 containers: gateway / fetcher / agent
- Network segmentation (agent cannot reach external)

## CLI Commands

| Command | Description |
|---|---|
| `claw-guard init` | Set up for your AI agent environment |
| `claw-guard evaluate --json` | Evaluate a tool request (hook entry point) |
| `claw-guard test` | Validate rules, engine, and configuration |
| `claw-guard serve` | HTTP hook server (1-3ms latency) |
| `claw-guard log` | View audit log |
| `claw-guard dashboard` | Open web dashboard |
| `claw-guard feed` | Manage threat feed (`--update`, `--status`) |
| `claw-guard marketplace` | Manage rule packs (`installed`, `install`, `remove`) |
| `claw-guard upgrade` | License management (`--key`, `--remove`) |
| `claw-guard passport` | Security passport & GitHub badges |
| `claw-guard replay` | Incident replay & causal analysis |
| `claw-guard report` | Weekly safety report |
| `claw-guard monitor` | False positive monitoring |
| `claw-guard docker` | Docker deployment (`init`, `up`, `down`) |
| `claw-guard skills` | Skills AV scanning |

## Configuration

Minimum config — just one line in `clawguard.yaml`:

```yaml
profile: balanced
```

### Presets

| Preset | Low Risk | Medium Risk | High Risk |
|---|---|---|---|
| `observer` | log | log | log |
| `guardian` | allow | confirm | deny |
| `balanced` | allow | confirm | confirm |
| `expert` | allow | allow | confirm |

### Priority

CLI args > Project (`.clawguard.yaml`) > Global (`~/.config/clawguard/`) > Default (`balanced`)

## Security Rules

### Core Rules (12)

| ID | Tool | Risk | Description |
|---|---|---|---|
| `BASH.RM_RISK` | bash | high | `rm -rf` recursive force delete |
| `BASH.GIT_RESET_HARD` | bash | high | `git reset --hard` |
| `BASH.GIT_CLEAN_FDX` | bash | high | `git clean -fdx` |
| `BASH.GIT_PUSH_FORCE` | bash | high | `git push --force` |
| `BASH.CHMOD_777` | bash | medium | `chmod 777` world-writable |
| `BASH.ROOT_PATH_OP` | bash | high | Operations targeting `/` |
| `BASH.PIPE_EXEC_001` | bash | high | `curl \| bash` pipe execution |
| `BASH.PIPE_EXEC_002` | bash | high | `wget \| sh` pipe execution |
| `BASH.SSH_KEY_READ` | bash | medium | SSH key file access |
| `BASH.ENV_FILE_READ` | bash | medium | `.env` file access |
| `BASH.NPM_INSTALL` | bash | medium | `npm install <package>` |
| `BASH.PIP_INSTALL` | bash | medium | `pip install <package>` |

### Rule Format (YAML)

```yaml
- id: BASH.RM_RISK
  match:
    tool: bash
    command_regex: '(?:^|\s|;|&&|\|\|)rm\s+.*(-rf|-fr)\b'
  risk: high
  explain:
    title: "Bulk deletion risk"
    what: "Recursively deletes files and directories."
    why:
      - "Wrong path can destroy entire project."
    check:
      - "Is the target path correct?"
      - "Do you have backups/commits?"
    alternatives:
      - "Run `ls` first to verify targets"
  meta:
    author: "clawguard"
    pack: "core"
    version: "1.0.0"
    tags: ["destructive"]
    phase: 0
```

## Pricing

| Plan | Price | Key Features |
|---|---|---|
| **Free** | $0 | 8 core rules, weekly feed, basic replay (24h) |
| **Pro** | $12/mo | All rules, daily feed, passport, marketplace, Skills AV |
| **Max** | $39/mo | Team management, cross-team memory, org passport |

## Project Structure

```
packages/
├── core/           Policy engine, rule loader, presets, types
├── cli/            CLI tool (claw-guard command)
├── audit/          OCSF v1.1.0 audit logger
├── adapter-claude/ Claude Code PreToolUse hook
├── adapter-codex/  Codex approval policy extension
├── adapter-mcp/    MCP JSON-RPC proxy
├── billing/        License manager, feature gate
├── feed/           Signed daily feed client
├── enrichment/     npm registry, CVE lookup
├── memory/         SQLite decision store
├── reputation/     Community reputation aggregator
├── passport/       Security passport & badge generator
├── replay/         Incident replay & causal analysis
├── skills-av/      Hash manifest, static analysis
├── team/           Organization policy & member management
├── web-ui/         React dashboard
├── lp/             Landing page (EN + JP)
└── docker/         3-container reference implementation
rules/
├── core/           12 core rules (Phase 0-1)
└── phase2/         15 additional rules (Pro/Max)
```

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests (372 tests)
npm test

# Lint
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`) and lint is clean (`npm run lint`)
5. Submit a pull request

## License

MIT
