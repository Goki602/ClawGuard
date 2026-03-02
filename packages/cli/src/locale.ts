import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getGlobalConfigDir } from "@clawguard/core";
import { parse } from "yaml";

export type CliLang = "ja" | "en";

export function detectLocale(options?: { ignoreConfig?: boolean }): CliLang {
	// 1. Check saved config (skip for init command)
	if (!options?.ignoreConfig) {
		const configPath = join(getGlobalConfigDir(), "config.yaml");
		if (existsSync(configPath)) {
			try {
				const config = parse(readFileSync(configPath, "utf-8")) as Record<string, unknown>;
				if (config.lang === "ja" || config.lang === "en") return config.lang;
			} catch {
				// ignore
			}
		}
	}

	// 2. Check environment variables
	const envLang = process.env.LANG ?? process.env.LC_ALL ?? process.env.LANGUAGE ?? "";
	if (envLang.startsWith("ja")) return "ja";

	// 3. macOS: check AppleLocale (LANG is often C.UTF-8 on macOS)
	if (process.platform === "darwin") {
		try {
			const appleLocale = execFileSync("defaults", ["read", "-g", "AppleLocale"], { encoding: "utf-8" }).trim();
			if (appleLocale.startsWith("ja")) return "ja";
		} catch {
			// ignore
		}
	}

	return "en";
}
