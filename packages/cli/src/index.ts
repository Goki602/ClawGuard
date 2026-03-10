#!/usr/bin/env node
import { Command } from "commander";
import { dashboardCommand } from "./commands/dashboard.js";
import { dockerCommand } from "./commands/docker.js";
import { evaluateCommand } from "./commands/evaluate.js";
import { feedCommand } from "./commands/feed.js";
import { initCommand } from "./commands/init.js";
import { logCommand } from "./commands/log.js";
import { marketplaceCommand } from "./commands/marketplace.js";
import { monitorCommand } from "./commands/monitor.js";
import { passportCommand } from "./commands/passport.js";
import { replayCommand } from "./commands/replay.js";
import { reportCommand } from "./commands/report.js";
import { serveCommand } from "./commands/serve.js";
import { skillsCommand } from "./commands/skills.js";
import { statsCommand } from "./commands/stats.js";
import { teamCommand } from "./commands/team.js";
import { testCommand } from "./commands/test.js";


const program = new Command();

program
	.name("claw-guard")
	.description("AI agent memory — fewer prompts, smarter decisions")
	.version("0.1.0");

program
	.command("init")
	.description("Set up ClawGuard for your environment")
	.option("-p, --profile <preset>", "Preset profile (observer/guardian/balanced/expert)")
	.option("--agent <type>", "Agent type (claude/codex/mcp)")
	.action(initCommand);

program
	.command("evaluate")
	.description("Evaluate a tool request (used as Claude Code hook)")
	.option("--json", "JSON mode (stdin/stdout)")
	.action(evaluateCommand);

program
	.command("test")
	.description("Validate rules, engine, and configuration")
	.action(testCommand);

program
	.command("stats")
	.description("View auto-allow count and decision summary")
	.action(statsCommand);

program
	.command("log")
	.description("View audit log")
	.option("--today", "Show today's log")
	.option("--date <date>", "Show log for specific date (YYYY-MM-DD)")
	.action(logCommand);

program
	.command("serve")
	.description("Start HTTP hook server for low-latency evaluation")
	.option("--port <port>", "Port number (default: 19280)")
	.option("--host <host>", "Host to bind (default: 127.0.0.1, use 0.0.0.0 for Docker)")
	.action(serveCommand);

program
	.command("dashboard")
	.description("Open the ClawGuard web dashboard")
	.option("--port <port>", "Port number (default: 19281)")
	.action(dashboardCommand);

program
	.command("feed")
	.description("Manage the ClawGuard threat feed")
	.option("--update", "Fetch the latest feed")
	.option("--status", "Show feed status")
	.action(feedCommand);

program
	.command("marketplace [action] [source]")
	.description("Manage rule packs (installed/install/remove/curate)")
	.action(marketplaceCommand);

program
	.command("passport")
	.description("Manage your security passport")
	.option("--generate", "Generate or update the passport")
	.option("--repo <repo>", "Repository identifier")
	.option("--badge", "Show badge Markdown snippet")
	.option("--publish", "Publish passport to ClawGuard API")
	.option("--key <key>", "License key for publishing")
	.action(passportCommand);

program
	.command("replay [session_id]")
	.description("Replay agent sessions and inspect decision chains")
	.option("--list", "List sessions")
	.option("--date <date>", "Date (YYYY-MM-DD)")
	.option("--causal", "Show causal chains")
	.option("--export <format>", "Export format (json|markdown)")
	.action(replayCommand);

program
	.command("report")
	.description("Generate weekly safety report")
	.option("--week <offset>", "Week offset (0=current, -1=previous)")
	.option("--output <format>", "Output format (json|markdown)")
	.option("--public", "Generate public security report")
	.action(reportCommand);

program
	.command("monitor")
	.description("Monitor false positive rates and rule health")
	.option("--alerts", "Show alerts only (warning+critical)")
	.option("--details", "Show detailed per-rule stats by time period")
	.action(monitorCommand);

program
	.command("docker [action]")
	.description("Manage Docker 3-container deployment (init/up/down/logs/status)")
	.action(dockerCommand);

program
	.command("skills [action]")
	.description("Scan and manage skill security (scan/manifest)")
	.option("--generate", "Generate new manifest")
	.option("--dir <dir>", "Skills directory path")
	.action(skillsCommand);

program
	.command("team [action] [target]")
	.description("Team management (serve/add/list/remove/policy)")
	.option("--admin-key <key>", "Admin key for team server")
	.option("--port <port>", "Port for team server (default: 19290)")
	.option("--role <role>", "Member role (admin/member/readonly)")
	.option("--profile <preset>", "Team policy profile")
	.option("--enforce", "Enforce team policy")
	.action(teamCommand);

program.parse();
