import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
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
	low: string;
	desc: string;
	recommended?: boolean;
}

const PRESETS_JA: PresetRow[] = [
	{
		name: "observer",
		label: "（見るだけ）    ",
		high: "ログ",
		medium: "ログ",
		low: "ログ",
		desc: "何もブロックせず記録。AIの動きを把握したい時に",
	},
	{
		name: "guardian",
		label: "（しっかり）    ",
		high: "拒否",
		medium: "確認",
		low: "許可",
		desc: "よく確認する。AI初心者に最適",
	},
	{
		name: "balanced",
		label: "（バランス）    ",
		high: "確認",
		medium: "確認",
		low: "許可",
		desc: "時々確認。すぐ学習する。ほとんどの人に最適",
		recommended: true,
	},
	{
		name: "expert",
		label: "（静か）        ",
		high: "確認",
		medium: "許可",
		low: "許可",
		desc: "ほぼ無音。本当に危ない操作だけ確認",
	},
];

const PRESETS_EN: PresetRow[] = [
	{
		name: "observer",
		label: "(Watch only)",
		high: "log    ",
		medium: "log    ",
		low: "log  ",
		desc: "Logs everything, blocks nothing. See what your agent does.",
	},
	{
		name: "guardian",
		label: "(Careful)   ",
		high: "deny   ",
		medium: "confirm",
		low: "allow",
		desc: "Asks often. Best for getting started with AI agents.",
	},
	{
		name: "balanced",
		label: "(Balanced)  ",
		high: "confirm",
		medium: "confirm",
		low: "allow",
		desc: "Asks sometimes. Learns fast. Best for most users.",
		recommended: true,
	},
	{
		name: "expert",
		label: "(Quiet)     ",
		high: "confirm",
		medium: "allow  ",
		low: "allow",
		desc: "Almost silent. Only flags truly dangerous operations.",
	},
];

const DEFAULT_INDEX = 2; // balanced (0-based)

const MSG = {
	ja: {
		title: "ClawGuard セットアップ",
		choose: "プリセットを選んでください:",
		header: "                                      危険   注意   安全",
		prompt: `選択 [1-4] (デフォルト: ${DEFAULT_INDEX + 1}): `,
		selected: (name: string) => `${name} を選択しました`,
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
		header: "                                   High    Medium  Low",
		prompt: `Select [1-4] (default: ${DEFAULT_INDEX + 1}): `,
		selected: (name: string) => `Selected ${name}`,
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
		for (let i = 0; i < presets.length; i++) {
			const p = presets[i];
			const num = chalk.bold(`[${i + 1}]`);
			const rec = p.recommended ? chalk.cyan(` ${m.rec}`) : "";
			console.log(
				`  ${num} ${chalk.bold(p.name.padEnd(10))}${p.label}   ${p.high}   ${p.medium}   ${p.low}${rec}`,
			);
			console.log(`              ${chalk.dim(p.desc)}`);
			console.log("");
		}

		const rl = createInterface({ input: process.stdin, output: process.stdout });
		const answer = await rl.question(chalk.cyan(m.prompt));
		rl.close();

		const idx = Number.parseInt(answer.trim(), 10) - 1;
		const chosen = idx >= 0 && idx < presets.length ? idx : DEFAULT_INDEX;
		profile = presets[chosen].name;
		console.log(`${chalk.green("✓")} ${m.selected(chalk.bold(profile))}\n`);
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
