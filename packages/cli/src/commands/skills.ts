import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import chalk from "chalk";

export async function skillsCommand(
	action?: string,
	options: { generate?: boolean; dir?: string } = {},
): Promise<void> {
	const skillsDir = options.dir ?? resolve(homedir(), ".claude", "skills");

	switch (action) {
		case "scan": {
			if (!existsSync(skillsDir)) {
				console.log(chalk.yellow("No skills directory found"));
				return;
			}
			try {
				const { SkillsScanner } = await import("@clawguard/skills-av");
				const scanner = new SkillsScanner(skillsDir);
				const results = scanner.scanAllSkills(skillsDir);

				if (results.length === 0) {
					console.log(chalk.dim("No skills found"));
					return;
				}

				console.log(chalk.bold(`Scanning ${results.length} skills...\n`));
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
				console.error(chalk.red("Skills AV module not available"));
			}
			break;
		}
		case "manifest": {
			if (!existsSync(skillsDir)) {
				console.log(chalk.yellow("No skills directory found"));
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
					console.log(chalk.green(`Manifest generated: ${manifest.skills.length} skills`));
				} else {
					const manifest = manager.load();
					if (manifest) {
						console.log(`Version: ${manifest.version}`);
						console.log(`Generated: ${manifest.generated_at}`);
						console.log(`Skills: ${manifest.skills.length}`);
						for (const s of manifest.skills) {
							const icon = s.has_exec ? chalk.yellow("⚠") : chalk.green("✓");
							console.log(
								`  ${icon} ${s.name} (${s.files} files, hash: ${s.hash.slice(0, 12)}...)`,
							);
						}
					} else {
						console.log(chalk.dim("No manifest found. Run with --generate to create one."));
					}
				}
			} catch {
				console.error(chalk.red("Skills AV module not available"));
			}
			break;
		}
		default:
			console.log(chalk.bold("ClawGuard Skills AV Commands:"));
			console.log("  claw-guard skills scan                Scan all installed skills");
			console.log("  claw-guard skills manifest            Show current manifest");
			console.log("  claw-guard skills manifest --generate Generate new manifest");
			break;
	}
}
