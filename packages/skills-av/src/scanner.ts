import { existsSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import type { RevocationList, SkillScanResult } from "@clawguard/core";
import { ManifestManager } from "./manifest-manager.js";
import { RevocationChecker } from "./revocation-checker.js";
import { StaticAnalyzer } from "./static-analyzer.js";

export class SkillsScanner {
	private manifestManager: ManifestManager;
	private revocationChecker: RevocationChecker;
	private staticAnalyzer: StaticAnalyzer;

	constructor(projectRoot: string, revocations?: RevocationList) {
		this.manifestManager = new ManifestManager(projectRoot);
		this.revocationChecker = new RevocationChecker(revocations);
		this.staticAnalyzer = new StaticAnalyzer();
	}

	scanDir(skillPath: string): SkillScanResult {
		const name = basename(skillPath);
		const findings: SkillScanResult["findings"] = [];

		// Static analysis
		findings.push(...this.staticAnalyzer.analyzeDir(skillPath));

		// Revocation check
		const entry = this.manifestManager.buildEntry(skillPath);
		const revoked = this.revocationChecker.isRevoked(entry.hash);
		if (revoked) {
			findings.push({
				type: "revoked_hash",
				severity: "high",
				detail: `Revoked: ${revoked.reason}`,
			});
		}

		// Manifest change detection
		const savedManifest = this.manifestManager.load();
		if (savedManifest) {
			const prev = savedManifest.skills.find((s) => s.name === name);
			if (prev) {
				const changes = this.manifestManager.detectChanges(prev, entry);
				for (const change of changes) {
					if (change === "exec_added") {
						findings.push({
							type: "hash_mismatch",
							severity: "high",
							detail: "Executable content added since last verification",
						});
					} else if (change === "hash_changed") {
						findings.push({
							type: "hash_mismatch",
							severity: "medium",
							detail: "Skill content changed since last verification",
						});
					}
				}
			}
		}

		let status: SkillScanResult["status"] = "clean";
		if (findings.some((f) => f.type === "revoked_hash")) status = "revoked";
		else if (findings.length > 0) status = "warning";

		return { name, path: skillPath, status, findings };
	}

	scanAllSkills(skillsBaseDir: string): SkillScanResult[] {
		if (!existsSync(skillsBaseDir)) return [];
		const dirs = readdirSync(skillsBaseDir, { withFileTypes: true })
			.filter((d) => d.isDirectory())
			.map((d) => join(skillsBaseDir, d.name));
		return dirs.map((d) => this.scanDir(d));
	}

	getManifestManager(): ManifestManager {
		return this.manifestManager;
	}
}
