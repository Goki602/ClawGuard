import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

interface HookDef {
	type: string;
	command?: string;
	url?: string;
	timeout?: number;
}

interface ClaudeSettings {
	hooks?: {
		PreToolUse?: Array<{
			matcher: string;
			hooks: HookDef[];
		}>;
	};
	[key: string]: unknown;
}

const COMMAND_HOOK_ENTRY = {
	matcher: "Bash|Write|Edit",
	hooks: [
		{
			type: "command",
			command: "claw-guard evaluate --json",
			timeout: 5,
		},
	],
};

const HTTP_HOOK_ENTRY = {
	matcher: "Bash|Write|Edit",
	hooks: [
		{
			type: "http",
			url: "http://127.0.0.1:19280/hook",
			timeout: 5,
		},
	],
};

function getSettingsPath(): string {
	return join(homedir(), ".claude", "settings.json");
}

function isClawGuardHook(h: HookDef): boolean {
	return (h.command?.includes("claw-guard") ?? false) || (h.url?.includes("19280") ?? false);
}

export type HookMode = "command" | "http";

export function installHook(
	settingsPath?: string,
	mode: HookMode = "command",
): {
	success: boolean;
	path: string;
	message: string;
} {
	const targetPath = settingsPath ?? getSettingsPath();
	let settings: ClaudeSettings = {};

	if (existsSync(targetPath)) {
		settings = JSON.parse(readFileSync(targetPath, "utf-8"));
	}

	if (!settings.hooks) {
		settings.hooks = {};
	}
	if (!settings.hooks.PreToolUse) {
		settings.hooks.PreToolUse = [];
	}

	// Remove existing ClawGuard hooks (to support switching modes)
	settings.hooks.PreToolUse = settings.hooks.PreToolUse.filter(
		(entry) => !entry.hooks?.some(isClawGuardHook),
	);

	const entry = mode === "http" ? HTTP_HOOK_ENTRY : COMMAND_HOOK_ENTRY;
	settings.hooks.PreToolUse.push(entry);

	const dir = dirname(targetPath);
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
	writeFileSync(targetPath, JSON.stringify(settings, null, 2), "utf-8");

	const modeLabel = mode === "http" ? "HTTP (claw-guard serve)" : "command (claw-guard evaluate)";
	return { success: true, path: targetPath, message: `ClawGuard hook installed (${modeLabel})` };
}

export function uninstallHook(settingsPath?: string): { success: boolean; message: string } {
	const targetPath = settingsPath ?? getSettingsPath();
	if (!existsSync(targetPath)) {
		return { success: true, message: "No settings file found" };
	}

	const settings: ClaudeSettings = JSON.parse(readFileSync(targetPath, "utf-8"));
	if (!settings.hooks?.PreToolUse) {
		return { success: true, message: "No hooks to remove" };
	}

	settings.hooks.PreToolUse = settings.hooks.PreToolUse.filter(
		(entry) => !entry.hooks?.some(isClawGuardHook),
	);

	writeFileSync(targetPath, JSON.stringify(settings, null, 2), "utf-8");
	return { success: true, message: "ClawGuard hook removed" };
}
