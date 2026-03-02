import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { installHook } from "@clawguard/adapter-claude";
import { getGlobalConfigDir, isValidPresetName } from "@clawguard/core";
import type { PresetName } from "@clawguard/core";
import chalk from "chalk";
import { type CliLang, detectLocale } from "../locale.js";

interface PresetRow {
	name: PresetName;
	label: string;
	high: string;
	medium: string;
	recommended?: boolean;
}

const PRESETS_JA: PresetRow[] = [
	{ name: "observer", label: "（見守りモード）", high: "ログ", medium: "ログ" },
	{ name: "guardian", label: "（厳格モード）  ", high: "拒否", medium: "確認" },
	{ name: "balanced", label: "（バランス型）  ", high: "確認", medium: "確認", recommended: true },
	{ name: "expert", label: "（上級者向け）  ", high: "確認", medium: "許可" },
];

const PRESETS_EN: PresetRow[] = [
	{ name: "observer", label: "(Watch mode)", high: "log    ", medium: "log    " },
	{ name: "guardian", label: "(Strict)    ", high: "deny   ", medium: "confirm" },
	{
		name: "balanced",
		label: "(Balanced)  ",
		high: "confirm",
		medium: "confirm",
		recommended: true,
	},
	{ name: "expert", label: "(Expert)    ", high: "confirm", medium: "allow  " },
];

const MSG = {
	ja: {
		title: "ClawGuard セットアップ",
		choose: "プリセットを選んでください:",
		header: "                                  危険   注意",
		hint: (cmd: string) => `ヒント: ${cmd} で指定できます`,
		defaultUsing: (name: string) => `デフォルト: ${name} を使用します`,
		rec: "<- おすすめ",
		created: (path: string, profile: string) => `${path} を作成しました (profile: ${profile})`,
		done: "セットアップ完了！",
		next: "次のステップ:",
		testDesc: "動作確認",
		logDesc: "監査ログ表示",
	},
	en: {
		title: "ClawGuard Setup",
		choose: "Choose a preset:",
		header: "                               High    Medium",
		hint: (cmd: string) => `Hint: ${cmd}`,
		defaultUsing: (name: string) => `Default: using ${name}`,
		rec: "<- recommended",
		created: (path: string, profile: string) => `Created ${path} (profile: ${profile})`,
		done: "Setup complete!",
		next: "Next steps:",
		testDesc: "run diagnostics",
		logDesc: "view audit log",
	},
};

export async function initCommand(options: { profile?: string; agent?: string }): Promise<void> {
	const lang: CliLang = detectLocale({ ignoreConfig: true });
	const m = MSG[lang];
	const presets = lang === "ja" ? PRESETS_JA : PRESETS_EN;
	let profile: PresetName;

	if (options.profile && isValidPresetName(options.profile)) {
		profile = options.profile;
	} else {
		console.log(chalk.bold(`\n${m.title}\n`));
		console.log(`${m.choose}\n`);
		console.log(chalk.dim(m.header));
		for (const p of presets) {
			const rec = p.recommended ? chalk.cyan(` ${m.rec}`) : "";
			console.log(`  ${chalk.bold(p.name.padEnd(10))}${p.label}   ${p.high}   ${p.medium}${rec}`);
		}
		console.log(`\n${m.hint(chalk.cyan("claw-guard init --profile <preset>"))}`);
		profile = "balanced";
		console.log(`${m.defaultUsing(chalk.bold("balanced"))}\n`);
	}

	// Create global config (save lang for future commands)
	const configDir = getGlobalConfigDir();
	if (!existsSync(configDir)) {
		mkdirSync(configDir, { recursive: true });
	}

	const configPath = join(configDir, "config.yaml");
	writeFileSync(configPath, `profile: ${profile}\nlang: ${lang}\n`, "utf-8");
	console.log(`${chalk.green("✓")} ${m.created(configPath, profile)}`);

	// Install hooks based on agent type
	const agentType = options.agent ?? "claude";

	if (agentType === "codex") {
		try {
			const { installCodexHook } = await import("@clawguard/adapter-codex");
			const hookResult = installCodexHook();
			console.log(`${chalk.green("✓")} ${hookResult.message} (${hookResult.path})`);
		} catch {
			console.error(chalk.yellow("Codex adapter not available"));
		}
	} else if (agentType === "mcp") {
		console.log(`${chalk.green("✓")} MCP adapter configured`);
		console.log(`  Start MCP proxy: ${chalk.cyan("claw-guard serve --host 0.0.0.0")}`);
	} else {
		const hookResult = installHook();
		console.log(`${chalk.green("✓")} ${hookResult.message} (${hookResult.path})`);
	}

	console.log(`${chalk.green("✓")} ${m.done}`);
	console.log(`\n${m.next}`);
	console.log(`  ${chalk.cyan("claw-guard test")}   — ${m.testDesc}`);
	console.log(`  ${chalk.cyan("claw-guard log")}    — ${m.logDesc}`);
}
