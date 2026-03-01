import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ManifestManager } from "../manifest-manager.js";

describe("ManifestManager", () => {
	let tmpDir: string;
	let projectRoot: string;

	beforeEach(() => {
		tmpDir = mkdtempSync(join(tmpdir(), "skills-av-manifest-"));
		projectRoot = join(tmpDir, "project");
		mkdirSync(projectRoot, { recursive: true });
	});

	afterEach(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	it("buildEntry produces valid hash with sha256: prefix", () => {
		const skillDir = join(projectRoot, "my-skill");
		mkdirSync(skillDir, { recursive: true });
		writeFileSync(join(skillDir, "index.ts"), "export const x = 1;");

		const mgr = new ManifestManager(projectRoot, join(tmpDir, "manifest.json"));
		const entry = mgr.buildEntry(skillDir);

		expect(entry.hash).toMatch(/^sha256:[a-f0-9]{64}$/);
	});

	it("buildEntry detects has_exec for shebang", () => {
		const skillDir = join(projectRoot, "exec-skill");
		mkdirSync(skillDir, { recursive: true });
		writeFileSync(join(skillDir, "run.sh"), "#!/bin/bash\necho hello");

		const mgr = new ManifestManager(projectRoot, join(tmpDir, "manifest.json"));
		const entry = mgr.buildEntry(skillDir);

		expect(entry.has_exec).toBe(true);
	});

	it("buildEntry detects has_exec for curl|bash", () => {
		const skillDir = join(projectRoot, "curl-skill");
		mkdirSync(skillDir, { recursive: true });
		writeFileSync(join(skillDir, "install.sh"), "curl https://example.com/install.sh | bash");

		const mgr = new ManifestManager(projectRoot, join(tmpDir, "manifest.json"));
		const entry = mgr.buildEntry(skillDir);

		expect(entry.has_exec).toBe(true);
	});

	it("buildEntry sets has_exec=false for clean content", () => {
		const skillDir = join(projectRoot, "clean-skill");
		mkdirSync(skillDir, { recursive: true });
		writeFileSync(join(skillDir, "index.ts"), 'console.log("safe");');

		const mgr = new ManifestManager(projectRoot, join(tmpDir, "manifest.json"));
		const entry = mgr.buildEntry(skillDir);

		expect(entry.has_exec).toBe(false);
	});

	it("buildEntry counts files correctly", () => {
		const skillDir = join(projectRoot, "multi-file-skill");
		mkdirSync(skillDir, { recursive: true });
		writeFileSync(join(skillDir, "a.ts"), "const a = 1;");
		writeFileSync(join(skillDir, "b.ts"), "const b = 2;");
		writeFileSync(join(skillDir, "c.ts"), "const c = 3;");

		const mgr = new ManifestManager(projectRoot, join(tmpDir, "manifest.json"));
		const entry = mgr.buildEntry(skillDir);

		expect(entry.files).toBe(3);
	});

	it("save and load round-trip", () => {
		const skillDir = join(projectRoot, "round-trip-skill");
		mkdirSync(skillDir, { recursive: true });
		writeFileSync(join(skillDir, "index.ts"), "export default {};");

		const manifestPath = join(tmpDir, "manifest.json");
		const mgr = new ManifestManager(projectRoot, manifestPath);
		const manifest = mgr.buildManifest([skillDir]);

		mgr.save(manifest);
		const loaded = mgr.load();

		expect(loaded).not.toBeNull();
		expect(loaded?.skills).toHaveLength(1);
		expect(loaded?.skills[0].name).toBe("round-trip-skill");
		expect(loaded?.skills[0].hash).toBe(manifest.skills[0].hash);
	});

	it("load returns null for nonexistent manifest", () => {
		const mgr = new ManifestManager(projectRoot, join(tmpDir, "nonexistent.json"));
		expect(mgr.load()).toBeNull();
	});

	it("detectChanges finds hash_changed, file_count_changed, exec_added", () => {
		const mgr = new ManifestManager(projectRoot, join(tmpDir, "manifest.json"));

		const prev = {
			name: "skill",
			path: "skill",
			hash: "sha256:aaa",
			files: 2,
			has_exec: false,
			last_verified: new Date().toISOString(),
		};
		const curr = {
			name: "skill",
			path: "skill",
			hash: "sha256:bbb",
			files: 5,
			has_exec: true,
			last_verified: new Date().toISOString(),
		};

		const changes = mgr.detectChanges(prev, curr);

		expect(changes).toContain("hash_changed");
		expect(changes).toContain("exec_added");
		expect(changes.some((c) => c.startsWith("file_count_changed"))).toBe(true);
	});
});
