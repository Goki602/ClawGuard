import { readFileSync } from "node:fs";
import { createEngineContext, evaluateHookRequest } from "../engine-factory.js";

export async function evaluateCommand(options: { json?: boolean }): Promise<void> {
	if (!options.json) {
		console.error("Usage: claw-guard evaluate --json (reads from stdin)");
		process.exit(1);
	}

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
	const { output } = evaluateHookRequest(rawInput, ctx);

	if (output) {
		process.stdout.write(JSON.stringify(output));
	}

	process.exit(0);
}
