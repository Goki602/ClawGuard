# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-02

### Added

#### Phase 0: Foundation
- Policy Engine core with regex-based rule matching and risk→action mapping
- 8 core security rules (high risk: destructive ops, external script execution)
- 4 presets: observer, guardian, balanced, expert
- Config resolver with priority chain (CLI > project > global > default)
- ExplainRisk terminal formatter with actionable explanations
- OCSF v1.1.0 audit logger (class_uid 6003, JSONL format)
- Claude Code Adapter (PreToolUse hook, JSON in/out, permission_mode check)
- CLI commands: `evaluate`, `init`, `test`, `log`, `serve`, `dashboard`
- HTTP hook server with <100ms latency (1-3ms achieved)
- Web UI dashboard (React + Tailwind)

#### Phase 1: Differentiation Experience
- Data-enriched ExplainRisk (npm registry DL count, CVE lookup via NVD/GitHub Advisory)
- Cross-agent decision memory (SQLite, shared across sessions)
- Exception management with project_overrides auto-write
- +2 rules: SSH key read, .env file read
- Enrichment cache with 5-minute TTL

#### Phase 2: Network Construction
- Billing system (LicenseManager + FeatureGate, free/pro/max tiers)
- Feed system (FeedClient + FeedCache, cosign signature verification)
- Reputation Network (ReputationAggregator + TelemetryUploader)
- Rule Marketplace (install/remove/list packs)
- +15 Phase 2 rules (package/network/skill, medium risk)
- CLI commands: `feed`, `marketplace`, `upgrade`

#### Phase 3: Non-Customer Conversion
- Security Passport with GitHub README badge generation
- Incident Replay with session timeline and causal chain analysis
- Weekly safety report (safety score, decision breakdown, trends)
- CLI commands: `passport`, `replay`, `report`

#### Phase 4: Ecosystem Expansion
- Docker 3-container reference implementation (gateway/fetcher/agent)
- Codex Adapter (approval policy extension)
- MCP Adapter (JSON-RPC proxy)
- Team/organization features (policy server, member store, audit store)
- Skills AV (hash manifest, revocation list, static analysis)
- Landing page (EN + JP)
- CLI commands: `docker`, `skills`

#### Ongoing
- False positive monitoring (override_rate tracking, anomaly detection)
- Weekly public security report
- Community rule curation pipeline

#### Infrastructure
- 375 unit + integration tests
- CI/CD with GitHub Actions
- esbuild bundling for npm distribution
- Biome linting (0 errors)

[0.1.0]: https://github.com/Goki602/ClawGuard/releases/tag/v0.1.0
