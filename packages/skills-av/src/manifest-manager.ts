import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, relative } from "node:path";
import type { SkillManifest, SkillManifestEntry } from "@clawguard/core";

const EXEC_PATTERNS = [
	/^#!.*\b(bash|sh|node|python)\b/m,
	/\bcurl\s.*\|\s*(bash|sh)\b/,
	/\bwget\s.*\|\s*(bash|sh)\b/,
	/\bchmod\s+\+x\b/,
];

export class ManifestManager {
	private manifestPath: string;

	constructor(
		private projectRoot: string,
		manifestPath?: string,
	) {
		this.manifestPath = manifestPath ?? join(homedir(), ".clawguard", "skills-manifest.json");
	}

	buildEntry(skillDir: string): SkillManifestEntry {
		const name = basename(skillDir);
		const path = relative(this.projectRoot, skillDir);
		const files = this.listFiles(skillDir);
		const contents = files.map((f) => readFileSync(join(skillDir, f), "utf-8"));
		const combined = files.map((f, i) => `${f}\n${contents[i]}`).join("\n---\n");
		const hash = `sha256:${createHash("sha256").update(combined).digest("hex")}`;
		const hasExec = contents.some((c) => EXEC_PATTERNS.some((p) => p.test(c)));
		return {
			name,
			path,
			hash,
			files: files.length,
			has_exec: hasExec,
			last_verified: new Date().toISOString(),
		};
	}

	private listFiles(dir: string): string[] {
		if (!existsSync(dir)) return [];
		return readdirSync(dir, { withFileTypes: true })
			.filter((d) => d.isFile())
			.map((d) => d.name)
			.sort();
	}

	buildManifest(skillsDirs: string[]): SkillManifest {
		return {
			version: new Date().toISOString().split("T")[0],
			generated_at: new Date().toISOString(),
			skills: skillsDirs.map((d) => this.buildEntry(d)),
		};
	}

	save(manifest: SkillManifest): void {
		const dir = dirname(this.manifestPath);
		if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
		writeFileSync(this.manifestPath, JSON.stringify(manifest, null, "\t"), "utf-8");
	}

	load(): SkillManifest | null {
		if (!existsSync(this.manifestPath)) return null;
		return JSON.parse(readFileSync(this.manifestPath, "utf-8"));
	}

	detectChanges(prev: SkillManifestEntry, curr: SkillManifestEntry): string[] {
		const changes: string[] = [];
		if (prev.hash !== curr.hash) changes.push("hash_changed");
		if (prev.files !== curr.files)
			changes.push(`file_count_changed: ${prev.files} -> ${curr.files}`);
		if (!prev.has_exec && curr.has_exec) changes.push("exec_added");
		return changes;
	}
}
