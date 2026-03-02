import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import chalk from "chalk";
import { detectLocale } from "../locale.js";

const MSG = {
	ja: {
		noDir: "スキルディレクトリが見つかりません",
		noSkills: "スキルが見つかりません",
		scanning: (n: number) => `${n} 個のスキルをスキャン中...\n`,
		avUnavailable: "Skills AV モジュールが利用できません",
		manifestGenerated: (n: number) => `マニフェスト生成: ${n} スキル`,
		version: "バージョン:",
		generated: "生成日:",
		skills: "スキル:",
		filesHash: (files: number, hash: string) => `${files} ファイル, ハッシュ: ${hash}...`,
		noManifest: "マニフェストが見つかりません。--generate で作成してください。",
		helpTitle: "ClawGuard Skills AV コマンド:",
		helpScan: "  claw-guard skills scan                全スキルをスキャン",
		helpManifest: "  claw-guard skills manifest            現在のマニフェストを表示",
		helpGenerate: "  claw-guard skills manifest --generate マニフェストを生成",
	},
	en: {
		noDir: "No skills directory found",
		noSkills: "No skills found",
		scanning: (n: number) => `Scanning ${n} skills...\n`,
		avUnavailable: "Skills AV module not available",
		manifestGenerated: (n: number) => `Manifest generated: ${n} skills`,
		version: "Version:",
		generated: "Generated:",
		skills: "Skills:",
		filesHash: (files: number, hash: string) => `${files} files, hash: ${hash}...`,
		noManifest: "No manifest found. Run with --generate to create one.",
		helpTitle: "ClawGuard Skills AV Commands:",
		helpScan: "  claw-guard skills scan                Scan all installed skills",
		helpManifest: "  claw-guard skills manifest            Show current manifest",
		helpGenerate: "  claw-guard skills manifest --generate Generate new manifest",
	},
};

export async function skillsCommand(
	action?: string,
	options: { generate?: boolean; dir?: string } = {},
): Promise<void> {
	const m = MSG[detectLocale()];
	const skillsDir = options.dir ?? resolve(homedir(), ".claude", "skills");

	switch (action) {
		case "scan": {
			if (!existsSync(skillsDir)) {
				console.log(chalk.yellow(m.noDir));
				return;
			}
			try {
				const { SkillsScanner } = await import("@clawguard/skills-av");
				const scanner = new SkillsScanner(skillsDir);
				const results = scanner.scanAllSkills(skillsDir);

				if (results.length === 0) {
					console.log(chalk.dim(m.noSkills));
					return;
				}

				console.log(chalk.bold(m.scanning(results.length)));
				for (const result of results) {
					const icon =
						result.status === "clean"
							? chalk.green("✓")
							: result.status === "warning"
								? chalk.yellow("⚠")
								: chalk.red("✗");
					console.log(`  ${icon} ${result.name}: ${result.status}`);
					for (const f of result.findings) {
						console.log(chalk.dim(`      ${f.severity} — ${f.detail}`));
					}
				}
			} catch {
				console.error(chalk.red(m.avUnavailable));
			}
			break;
		}
		case "manifest": {
			if (!existsSync(skillsDir)) {
				console.log(chalk.yellow(m.noDir));
				return;
			}
			try {
				const { ManifestManager } = await import("@clawguard/skills-av");
				const manager = new ManifestManager(skillsDir);

				if (options.generate) {
					const dirs = readdirSync(skillsDir, { withFileTypes: true })
						.filter((d) => d.isDirectory())
						.map((d) => resolve(skillsDir, d.name));
					const manifest = manager.buildManifest(dirs);
					manager.save(manifest);
					console.log(chalk.green(m.manifestGenerated(manifest.skills.length)));
				} else {
					const manifest = manager.load();
					if (manifest) {
						console.log(`${m.version} ${manifest.version}`);
						console.log(`${m.generated} ${manifest.generated_at}`);
						console.log(`${m.skills} ${manifest.skills.length}`);
						for (const s of manifest.skills) {
							const icon = s.has_exec ? chalk.yellow("⚠") : chalk.green("✓");
							console.log(`  ${icon} ${s.name} (${m.filesHash(s.files, s.hash.slice(0, 12))})`);
						}
					} else {
						console.log(chalk.dim(m.noManifest));
					}
				}
			} catch {
				console.error(chalk.red(m.avUnavailable));
			}
			break;
		}
		default:
			console.log(chalk.bold(m.helpTitle));
			console.log(m.helpScan);
			console.log(m.helpManifest);
			console.log(m.helpGenerate);
			break;
	}
}
