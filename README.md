# ClawGuard

> AI Agent Memory — Fewer Prompts, Smarter Decisions

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-380%20passing-brightgreen)]()
[![Node](https://img.shields.io/badge/node-%3E%3D20-green)]()

[日本語版はこちら](README.ja.md)

## What is ClawGuard?

AI agents ask too many questions. Every `npm install`, every `git push` — confirm, confirm, confirm. You said yes 5 minutes ago; now it's asking again.

ClawGuard remembers. When you approve an operation, it's stored. Next time the same pattern appears — in this session, another agent, or a different tool — auto-allowed. Your trust decisions travel across Claude Code and other hook-compatible agents.

Dangerous operations (`rm -rf`, `git push --force`, `curl|bash`) are still caught automatically. But that's not why you install ClawGuard — you install it because your agents get faster and quieter.

## Quick Start

```bash
# Install
npm install -g @clawguard-sec/cli

# Initialize (sets up hooks for your AI agent)
claw-guard init

# Verify installation
claw-guard test
```

## How It Works

```
First time:     Agent tries `npm install foo`
                    → ClawGuard asks → You allow → Remembered ✓

Second time:    Agent tries `npm install foo`
                    → Auto-allowed (no interruption) ✓

Dangerous:      Agent tries `rm -rf /`
                    → Caught, explained, requires your OK ✗
```

## Choose How Quiet

Pick a preset that matches your comfort level — from maximum visibility to near-silence:

| Preset | Style | Low Risk | Medium Risk | High Risk |
|---|---|---|---|---|
| `observer` | Watch only | log | log | log |
| `guardian` | Asks often | allow | confirm | deny |
| `balanced` | **Recommended** | allow | confirm | confirm |
| `expert` | Almost silent | allow | allow | confirm |

Minimum config — just one line in `clawguard.yaml`:

```yaml
profile: balanced
```

### Priority

CLI args > Project (`.clawguard.yaml`) > Global (`~/.config/clawguard/`) > Default (`balanced`)

## Architecture

### 2-Layer Design

**Layer 1 — Smart Approval** (hooks-based, no Docker required)
- Cross-agent decision memory (SQLite) — remembers what you approved
- Community reputation data in confirm dialogs (coming soon)
- Adapter → Policy Engine → allow/confirm/deny (under 100ms)
- Security Passport for compliance proof

**Layer 2 — Infrastructure Isolation** (Docker, optional reference implementation)
- `claw-guard docker init` to get docker-compose templates
- 3 containers: gateway / fetcher / agent
- Network segmentation (agent cannot reach external)

## Built-in Safety Net

ClawGuard silently catches dangerous operations. You don't need to configure anything — 12 rules ship by default.

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
| `BASH.SSH_KEY_READ` | bash | high | SSH key file access |
| `BASH.ENV_FILE_READ` | bash | medium | `.env` file access |
| `BASH.NPM_INSTALL` | bash | medium | `npm install <package>` |
| `BASH.PIP_INSTALL` | bash | medium | `pip install <package>` |

### When Does ClawGuard Ask?

| Condition | What happens | Example |
|---|---|---|
| Already approved (same session/history) | **Silent — auto-allowed** | `npm install express` (approved before) |
| No rule matched | **Silent — proceeds normally** | `git status`, `ls`, `npm test` |
| Rule matched + preset = **confirm** | Asks with data-backed explanation | `npm install unknown-pkg` |
| Rule matched + preset = **deny** | Blocked with explanation | `rm -rf /` in `guardian` mode |

### Important Limitations

| Condition | Why ClawGuard Cannot Intervene |
|---|---|
| AI agent refuses the command on its own | The tool call never happens, so the PreToolUse hook never fires. This is defense-in-depth — the agent's own safety layer acts upstream of ClawGuard. |
| Running in `bypassPermissions` or `dontAsk` mode | ClawGuard skips evaluation in these permission modes. |
| Hook not installed | Run `claw-guard init` to register the PreToolUse hook. |

> **Note:** To verify ClawGuard's rule matching directly, use `claw-guard test` or pipe JSON to `claw-guard evaluate --json`.

## CLI Commands

| Command | Description |
|---|---|
| `claw-guard init` | Set up for your AI agent environment |
| `claw-guard evaluate --json` | Evaluate a tool request (hook entry point) |
| `claw-guard test` | Validate rules, engine, and configuration |
| `claw-guard stats` | View auto-allow count and decision summary |
| `claw-guard serve` | HTTP hook server (low-latency) |
| `claw-guard log` | View audit log |
| `claw-guard dashboard` | Open web dashboard |
| `claw-guard feed` | Manage threat feed (`--update`, `--status`) |
| `claw-guard marketplace` | Manage rule packs (`installed`, `install`, `remove`) |
| `claw-guard passport` | Security passport & GitHub badges |
| `claw-guard replay` | Incident replay & causal analysis |
| `claw-guard report` | Weekly safety report |
| `claw-guard monitor` | False positive monitoring |
| `claw-guard docker` | Docker deployment (`init`, `up`, `down`) |
| `claw-guard skills` | Skills AV scanning |
| `claw-guard team` | Team management (serve/add/list/remove/policy) |

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

## Why ClawGuard?

| | Manual hooks | mcp-scan | ClawGuard |
|---|---|---|---|
| Cross-agent memory | - | - | **Yes** — approve once, auto-allowed everywhere |
| Works across Claude Code, Codex, MCP | - | MCP only | **All three** |
| Community intelligence | - | - | **Yes** — see what other devs decided |
| Setup | Write your own | Install + scan | `claw-guard init` (one command) |
| Price | Free (DIY) | Free | **Free (MIT, all features)** |

ClawGuard is not a blocker — it's a convenience layer. It reduces confirm fatigue by remembering your trust decisions and sharing community intelligence. Security is a side effect, not the sales pitch.

## Pricing

Completely free and open source (MIT). All features available to everyone — no license key, no paywalls.

## Telemetry

ClawGuard collects anonymous, aggregated usage statistics to power community intelligence — showing you what other developers decided for the same operation (e.g., "85% of users allowed this").

### What is sent (every 6 hours)

- Rule IDs and aggregate counts (allowed / denied / total per rule)

### What is NOT sent

- Commands, file paths, or arguments
- User identity, IP addresses, or session data
- Project names or repository information

### Disable telemetry

Add to your `clawguard.yaml`:

```yaml
reputation:
  opt_in: false
```

## Project Structure

```
packages/
├── core/           Policy engine, rule loader, presets, types
├── cli/            CLI tool (claw-guard command)
├── audit/          OCSF v1.1.0 audit logger
├── adapter-claude/ Claude Code PreToolUse hook
├── adapter-codex/  Codex approval policy extension
├── adapter-mcp/    MCP JSON-RPC proxy
├── billing/        Feature configuration (all features unlocked)
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
├── webhook/        Webhook handlers (Cloudflare Worker)
├── docker/         3-container reference implementation
├── api/            REST API server
├── sdk/            Embedded SDK for integrations
└── siem/           SIEM connector
rules/
├── core/           12 core rules (Phase 0-1)
└── phase2/         15 additional rules
```

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests (380 tests)
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
