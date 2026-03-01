import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { installCodexHook, uninstallCodexHook } from "../installer.js";

describe("installCodexHook", () => {
	const tmpDir = join(tmpdir(), `clawguard-test-codex-${Date.now()}`);
	const configPath = join(tmpDir, ".codex", "config.yaml");

	beforeEach(() => mkdirSync(tmpDir, { recursive: true }));
	afterEach(() => rmSync(tmpDir, { recursive: true, force: true }));

	it("installs hook in command mode", () => {
		const result = installCodexHook(configPath, "command");
		expect(result.success).toBe(true);
		expect(existsSync(configPath)).toBe(true);
		const content = readFileSync(configPath, "utf-8");
		expect(content).toContain("claw-guard evaluate --json");
		expect(content).toContain("# clawguard-managed");
	});

	it("installs hook in http mode", () => {
		const result = installCodexHook(configPath, "http");
		expect(result.success).toBe(true);
		const content = readFileSync(configPath, "utf-8");
		expect(content).toContain("http://127.0.0.1:19280/hook");
		expect(content).toContain("# clawguard-managed");
	});

	it("re-install is idempotent", () => {
		installCodexHook(configPath, "command");
		installCodexHook(configPath, "command");
		const content = readFileSync(configPath, "utf-8");
		const matches = content.match(/claw-guard evaluate/g);
		expect(matches).toHaveLength(1);
	});

	it("creates config dir if not exists", () => {
		const deepPath = join(tmpDir, "nested", "dir", "config.yaml");
		const result = installCodexHook(deepPath, "command");
		expect(result.success).toBe(true);
		expect(existsSync(deepPath)).toBe(true);
	});
});

describe("uninstallCodexHook", () => {
	const tmpDir = join(tmpdir(), `clawguard-test-codex-uninstall-${Date.now()}`);
	const configPath = join(tmpDir, ".codex", "config.yaml");

	beforeEach(() => mkdirSync(tmpDir, { recursive: true }));
	afterEach(() => rmSync(tmpDir, { recursive: true, force: true }));

	it("removes hook from config", () => {
		installCodexHook(configPath, "command");
		const result = uninstallCodexHook(configPath);
		expect(result.success).toBe(true);
		const content = readFileSync(configPath, "utf-8");
		expect(content).not.toContain("claw-guard");
		expect(content).not.toContain("clawguard-managed");
	});
});
