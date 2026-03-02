import { readFileSync } from "node:fs";
import chalk from "chalk";
import { createEngineContext, evaluateHookRequest } from "../engine-factory.js";
import { detectLocale } from "../locale.js";

export async function evaluateCommand(options: { json?: boolean }): Promise<void> {
	let rawInput: string;
	try {
		rawInput = readFileSync("/dev/stdin", "utf-8");
	} catch {
		process.exit(0);
		return;
	}

	if (!rawInput.trim()) {
		process.exit(0);
		return;
	}

	const ctx = createEngineContext();
	const { output, skipped } = evaluateHookRequest(rawInput, ctx);

	if (options.json) {
		// JSON mode for Claude Code hook integration
		if (output) {
			process.stdout.write(JSON.stringify(output));
		}
	} else {
		// Human-readable mode for manual testing
		if (skipped) {
			console.log(chalk.dim("(skipped — bypassPermissions mode)"));
		} else if (!output) {
			const lang = detectLocale();
			const msg = lang === "ja" ? "許可: ルールにマッチしませんでした" : "Allowed: no rule matched";
			console.log(`${chalk.green("✓")} ${msg}`);
		} else {
			const reason = output.hookSpecificOutput?.permissionDecisionReason;
			const action = output.hookSpecificOutput?.permissionDecision;
			const actionColor = action === "deny" ? chalk.red : chalk.yellow;
			const lang = detectLocale();
			const label = lang === "ja" ? "判定" : "Decision";
			console.log(`${actionColor(`● ${label}: ${action}`)}\n`);
			if (reason) {
				console.log(reason);
			}
		}
	}

	process.exit(0);
}
