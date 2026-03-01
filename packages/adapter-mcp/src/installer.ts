import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join } from "node:path";

interface McpServerEntry {
	command: string;
	args: string[];
}

interface ClaudeDesktopConfig {
	mcpServers?: Record<string, McpServerEntry>;
	[key: string]: unknown;
}

const CLAWGUARD_SERVER_KEY = "clawguard-proxy";

function getDefaultConfigPath(): string {
	if (platform() === "darwin") {
		return join(
			homedir(),
			"Library",
			"Application Support",
			"Claude",
			"claude_desktop_config.json",
		);
	}
	return join(homedir(), ".config", "Claude", "claude_desktop_config.json");
}

export function getMcpProxyConfig(upstreamPort: number): { command: string; args: string[] } {
	return {
		command: "claw-guard",
		args: ["serve", "--mcp", "--upstream", `http://127.0.0.1:${upstreamPort}`],
	};
}

export function installMcpProxy(configPath?: string): {
	success: boolean;
	path: string;
	message: string;
} {
	const targetPath = configPath ?? getDefaultConfigPath();
	let config: ClaudeDesktopConfig = {};

	if (existsSync(targetPath)) {
		config = JSON.parse(readFileSync(targetPath, "utf-8"));
	}

	if (!config.mcpServers) {
		config.mcpServers = {};
	}

	config.mcpServers[CLAWGUARD_SERVER_KEY] = getMcpProxyConfig(3100);

	const dir = dirname(targetPath);
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
	writeFileSync(targetPath, JSON.stringify(config, null, 2), "utf-8");

	return {
		success: true,
		path: targetPath,
		message:
			"ClawGuard MCP proxy entry installed. " +
			"Configure your MCP servers to route through the ClawGuard proxy by updating their upstream port.",
	};
}

export function uninstallMcpProxy(configPath?: string): {
	success: boolean;
	message: string;
} {
	const targetPath = configPath ?? getDefaultConfigPath();
	if (!existsSync(targetPath)) {
		return { success: true, message: "No config file found" };
	}

	const config: ClaudeDesktopConfig = JSON.parse(readFileSync(targetPath, "utf-8"));
	if (!config.mcpServers?.[CLAWGUARD_SERVER_KEY]) {
		return { success: true, message: "No ClawGuard MCP proxy entry to remove" };
	}

	delete config.mcpServers[CLAWGUARD_SERVER_KEY];
	writeFileSync(targetPath, JSON.stringify(config, null, 2), "utf-8");
	return { success: true, message: "ClawGuard MCP proxy entry removed" };
}
