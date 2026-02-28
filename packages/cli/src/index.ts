#!/usr/bin/env node
import { Command } from "commander";
import { dashboardCommand } from "./commands/dashboard.js";
import { evaluateCommand } from "./commands/evaluate.js";
import { initCommand } from "./commands/init.js";
import { logCommand } from "./commands/log.js";
import { serveCommand } from "./commands/serve.js";
import { testCommand } from "./commands/test.js";

const program = new Command();

program
	.name("claw-guard")
	.description("AI agent security companion — defend, audit, update")
	.version("0.1.0");

program
	.command("init")
	.description("Set up ClawGuard for your environment")
	.option("-p, --profile <preset>", "Preset profile (observer/guardian/balanced/expert)")
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
	.command("log")
	.description("View audit log")
	.option("--today", "Show today's log")
	.option("--date <date>", "Show log for specific date (YYYY-MM-DD)")
	.action(logCommand);

program
	.command("serve")
	.description("Start HTTP hook server for low-latency evaluation")
	.option("--port <port>", "Port number (default: 19280)")
	.action(serveCommand);

program
	.command("dashboard")
	.description("Open the ClawGuard web dashboard")
	.option("--port <port>", "Port number (default: 19281)")
	.action(dashboardCommand);

program.parse();
