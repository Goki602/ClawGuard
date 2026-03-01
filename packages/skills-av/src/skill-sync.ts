import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

export class SkillSync {
	constructor(private projectRoot: string) {}

	syncToBothAgents(sourceDir: string, skillName: string): { claude: string; codex: string } {
		const claudeDir = join(this.projectRoot, ".claude", "skills", skillName);
		const codexDir = join(this.projectRoot, ".agents", "skills", skillName);

		for (const dest of [claudeDir, codexDir]) {
			if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
			cpSync(sourceDir, dest, { recursive: true });
		}

		return { claude: claudeDir, codex: codexDir };
	}

	listSkillDirs(): string[] {
		const claudeSkillsDir = join(this.projectRoot, ".claude", "skills");
		if (!existsSync(claudeSkillsDir)) return [];
		return readdirSync(claudeSkillsDir, { withFileTypes: true })
			.filter((d) => d.isDirectory())
			.map((d) => join(claudeSkillsDir, d.name));
	}
}
