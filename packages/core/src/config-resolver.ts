import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { isValidPresetName } from "./preset-system.js";
import type { ClawGuardConfig, PresetName } from "./types.js";

const DEFAULT_CONFIG: ClawGuardConfig = { profile: "balanced" };

function tryLoadYaml(path: string): ClawGuardConfig | null {
	if (!existsSync(path)) return null;
	try {
		const content = readFileSync(path, "utf-8");
		return parse(content) as ClawGuardConfig;
	} catch {
		return null;
	}
}

export interface ResolveOptions {
	cliProfile?: string;
	projectDir?: string;
}

export function resolveConfig(options: ResolveOptions = {}): ClawGuardConfig {
	// Priority: CLI args > project config > global config > default
	const globalPath = join(getGlobalConfigDir(), "config.yaml");
	const globalConfig = tryLoadYaml(globalPath);

	let projectConfig: ClawGuardConfig | null = null;
	if (options.projectDir) {
		projectConfig =
			tryLoadYaml(join(options.projectDir, ".clawguard.yaml")) ??
			tryLoadYaml(join(options.projectDir, "clawguard.yaml"));
	}

	const merged: ClawGuardConfig = {
		...DEFAULT_CONFIG,
		...globalConfig,
		...projectConfig,
	};

	if (options.cliProfile && isValidPresetName(options.cliProfile)) {
		merged.profile = options.cliProfile as PresetName;
	}

	return merged;
}

export function getGlobalConfigDir(): string {
	return process.env.CLAWGUARD_CONFIG_DIR ?? join(homedir(), ".config", "clawguard");
}

export function getLogDir(): string {
	return join(homedir(), ".clawguard", "logs");
}

export function getCoreRulesDir(): string {
	const __dirname = dirname(fileURLToPath(import.meta.url));
	return join(__dirname, "..", "rules", "core");
}
