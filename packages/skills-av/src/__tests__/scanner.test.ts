import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { RevocationList } from "@clawguard/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SkillsScanner } from "../scanner.js";

describe("SkillsScanner", () => {
	let tmpDir: string;
	let projectRoot: string;

	beforeEach(() => {
		tmpDir = mkdtempSync(join(tmpdir(), "skills-av-scanner-"));
		projectRoot = join(tmpDir, "project");
		mkdirSync(projectRoot, { recursive: true });
	});

	afterEach(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	it("scanDir returns clean for safe skill", () => {
		const skillDir = join(projectRoot, "safe-skill");
		mkdirSync(skillDir, { recursive: true });
		writeFileSync(join(skillDir, "index.ts"), 'export const greeting = "hello";');

		const scanner = new SkillsScanner(projectRoot);
		const result = scanner.scanDir(skillDir);

		expect(result.status).toBe("clean");
		expect(result.findings).toHaveLength(0);
		expect(result.name).toBe("safe-skill");
	});

	it("scanDir returns warning for static pattern", () => {
		const skillDir = join(projectRoot, "risky-skill");
		mkdirSync(skillDir, { recursive: true });
		writeFileSync(join(skillDir, "setup.sh"), "rm -rf /tmp/cache");

		const scanner = new SkillsScanner(projectRoot);
		const result = scanner.scanDir(skillDir);

		expect(result.status).toBe("warning");
		expect(result.findings.length).toBeGreaterThan(0);
		expect(result.findings.some((f) => f.type === "static_pattern")).toBe(true);
	});

	it("scanDir returns revoked for revoked hash", () => {
		const skillDir = join(projectRoot, "revoked-skill");
		mkdirSync(skillDir, { recursive: true });
		writeFileSync(join(skillDir, "index.ts"), "const x = 42;");

		// First build entry to get the hash, then create scanner with that hash revoked
		const preScanner = new SkillsScanner(projectRoot);
		const entry = preScanner.getManifestManager().buildEntry(skillDir);

		const revocations: RevocationList = {
			version: "1",
			entries: [{ hash: entry.hash, reason: "Known malware", revoked_at: "2026-03-01T00:00:00Z" }],
		};

		const scanner = new SkillsScanner(projectRoot, revocations);
		const result = scanner.scanDir(skillDir);

		expect(result.status).toBe("revoked");
		expect(result.findings.some((f) => f.type === "revoked_hash")).toBe(true);
	});

	it("scanAllSkills handles empty directory", () => {
		const skillsBase = join(projectRoot, "skills");
		mkdirSync(skillsBase, { recursive: true });

		const scanner = new SkillsScanner(projectRoot);
		const results = scanner.scanAllSkills(skillsBase);

		expect(results).toHaveLength(0);
	});

	it("scanAllSkills scans multiple skills", () => {
		const skillsBase = join(projectRoot, "skills");
		const skill1 = join(skillsBase, "skill-a");
		const skill2 = join(skillsBase, "skill-b");
		mkdirSync(skill1, { recursive: true });
		mkdirSync(skill2, { recursive: true });
		writeFileSync(join(skill1, "index.ts"), 'export const a = "safe";');
		writeFileSync(join(skill2, "index.ts"), 'export const b = "also safe";');

		const scanner = new SkillsScanner(projectRoot);
		const results = scanner.scanAllSkills(skillsBase);

		expect(results).toHaveLength(2);
		const names = results.map((r) => r.name).sort();
		expect(names).toEqual(["skill-a", "skill-b"]);
	});

	it("scanDir detects exec_added change", () => {
		const skillDir = join(projectRoot, "evolving-skill");
		mkdirSync(skillDir, { recursive: true });

		// Phase 1: Create a clean skill and save manifest
		writeFileSync(join(skillDir, "index.ts"), 'export const safe = "clean";');
		const scanner = new SkillsScanner(projectRoot);
		const manifestMgr = scanner.getManifestManager();
		const manifest = manifestMgr.buildManifest([skillDir]);
		manifestMgr.save(manifest);

		// Phase 2: Add exec content to the skill
		writeFileSync(join(skillDir, "index.ts"), "#!/bin/bash\necho pwned");

		const result = scanner.scanDir(skillDir);

		expect(
			result.findings.some(
				(f) => f.type === "hash_mismatch" && f.detail.includes("Executable content added"),
			),
		).toBe(true);
	});
});
