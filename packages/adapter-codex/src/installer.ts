import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export type HookMode = "command" | "http";

const COMMAND_HOOK_LINE = "before_tool: claw-guard evaluate --json";
const HTTP_HOOK_LINE = "before_tool: http://127.0.0.1:19280/hook";
const CLAWGUARD_MARKER = "# clawguard-managed";

function getDefaultConfigPath(): string {
	return join(homedir(), ".codex", "config.yaml");
}

function isClawGuardBlock(line: string): boolean {
	return (
		line.includes(CLAWGUARD_MARKER) || line.includes("claw-guard") || line.includes("19280/hook")
	);
}

function buildHookBlock(mode: HookMode): string {
	const hookLine = mode === "http" ? HTTP_HOOK_LINE : COMMAND_HOOK_LINE;
	return `${hookLine} ${CLAWGUARD_MARKER}`;
}

function removeClawGuardLines(content: string): string {
	return content
		.split("\n")
		.filter((line) => !isClawGuardBlock(line))
		.join("\n");
}

export function installCodexHook(
	configPath?: string,
	mode: HookMode = "command",
): {
	success: boolean;
	path: string;
	message: string;
} {
	const targetPath = configPath ?? getDefaultConfigPath();
	let content = "";

	if (existsSync(targetPath)) {
		content = readFileSync(targetPath, "utf-8");
	}

	// Remove existing ClawGuard lines (to support switching modes)
	content = removeClawGuardLines(content);

	// Append hook block
	const hookBlock = buildHookBlock(mode);
	const separator = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
	content = `${content + separator + hookBlock}\n`;

	const dir = dirname(targetPath);
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
	writeFileSync(targetPath, content, "utf-8");

	const modeLabel = mode === "http" ? "HTTP (claw-guard serve)" : "command (claw-guard evaluate)";
	return { success: true, path: targetPath, message: `ClawGuard hook installed (${modeLabel})` };
}

export function uninstallCodexHook(configPath?: string): { success: boolean; message: string } {
	const targetPath = configPath ?? getDefaultConfigPath();
	if (!existsSync(targetPath)) {
		return { success: true, message: "No config file found" };
	}

	const content = readFileSync(targetPath, "utf-8");
	const cleaned = removeClawGuardLines(content);

	writeFileSync(targetPath, cleaned, "utf-8");
	return { success: true, message: "ClawGuard hook removed" };
}
