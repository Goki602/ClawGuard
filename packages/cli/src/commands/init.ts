import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { installHook } from "@clawguard/adapter-claude";
import { getGlobalConfigDir, isValidPresetName } from "@clawguard/core";
import type { PresetName } from "@clawguard/core";
import chalk from "chalk";

const PRESET_DESCRIPTIONS: Record<PresetName, string> = {
	observer: "👀 見守りモード — ブロックなし・ログのみ（AI初心者向け）",
	guardian: "🛡️ しっかり守る — 危険は止める・注意は確認（初心者〜中級者）",
	balanced: "⚖️ おすすめ — 安全と効率のバランス（経験者の初期値）",
	expert: "🔧 上級者向け — 最小限の確認（パワーユーザー）",
};

export async function initCommand(options: { profile?: string; agent?: string }): Promise<void> {
	let profile: PresetName;

	if (options.profile && isValidPresetName(options.profile)) {
		profile = options.profile;
	} else {
		// Default to balanced for non-interactive mode
		console.log(chalk.bold("\nClawGuard セットアップ\n"));
		console.log("利用可能なプリセット:");
		for (const [name, desc] of Object.entries(PRESET_DESCRIPTIONS)) {
			console.log(`  ${desc}`);
		}
		console.log(
			`\nヒント: ${chalk.cyan("claw-guard init --profile <preset>")} でプリセットを指定できます`,
		);
		profile = "balanced";
		console.log(`\nデフォルト: ${chalk.bold("balanced")}（おすすめ）を使用します\n`);
	}

	// Create global config
	const configDir = getGlobalConfigDir();
	if (!existsSync(configDir)) {
		mkdirSync(configDir, { recursive: true });
	}

	const configPath = join(configDir, "config.yaml");
	writeFileSync(configPath, `profile: ${profile}\n`, "utf-8");
	console.log(`${chalk.green("✓")} ${configPath} を作成しました（profile: ${profile}）`);

	// Install hooks based on agent type
	const agentType = options.agent ?? "claude";

	if (agentType === "codex") {
		try {
			const { installCodexHook } = await import("@clawguard/adapter-codex");
			const hookResult = installCodexHook();
			console.log(`${chalk.green("✓")} ${hookResult.message}（${hookResult.path}）`);
		} catch {
			console.error(chalk.yellow("Codex adapter not available"));
		}
	} else if (agentType === "mcp") {
		console.log(`${chalk.green("✓")} MCP adapter configured`);
		console.log(`  Start MCP proxy: ${chalk.cyan("claw-guard serve --host 0.0.0.0")}`);
	} else {
		const hookResult = installHook();
		console.log(`${chalk.green("✓")} ${hookResult.message}（${hookResult.path}）`);
	}

	console.log(`${chalk.green("✓")} セットアップ完了！`);
	console.log("\n次のステップ:");
	console.log(`  ${chalk.cyan("claw-guard test")}   — 動作確認`);
	console.log(`  ${chalk.cyan("claw-guard log")}    — 監査ログ表示`);
}
