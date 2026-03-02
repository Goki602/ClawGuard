export interface ClaudeHookInput {
	session_id: string;
	transcript_path?: string;
	cwd: string;
	permission_mode: string;
	hook_event_name: string;
	tool_name: string;
	tool_use_id?: string;
	tool_input: Record<string, unknown>;
}

export interface ClaudeHookOutput {
	hookSpecificOutput: {
		hookEventName: "PreToolUse";
		permissionDecision: "allow" | "deny" | "ask";
		permissionDecisionReason?: string;
	};
}

const NON_INTERVENTION_MODES = new Set(["bypassPermissions", "dontAsk"]);

export function shouldIntervene(permissionMode: string): boolean {
	return !NON_INTERVENTION_MODES.has(permissionMode);
}

export function isVscodeEnvironment(): boolean {
	return !!(
		process.env.VSCODE_PID ||
		process.env.VSCODE_CLI ||
		process.env.TERM_PROGRAM === "vscode"
	);
}
