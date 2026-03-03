import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getGlobalConfigDir, getLogDir, resolveConfig } from "../config-resolver.js";

describe("resolveConfig", () => {
	const originalConfigDir = process.env.CLAWGUARD_CONFIG_DIR;

	beforeAll(() => {
		// Isolate tests from user's global config
		process.env.CLAWGUARD_CONFIG_DIR = join(tmpdir(), "clawguard-test-nonexistent");
	});

	afterAll(() => {
		if (originalConfigDir === undefined) {
			// biome-ignore lint/performance/noDelete: must remove env var, not set to "undefined"
			delete process.env.CLAWGUARD_CONFIG_DIR;
		} else {
			process.env.CLAWGUARD_CONFIG_DIR = originalConfigDir;
		}
	});
	it("returns balanced as default", () => {
		const config = resolveConfig();
		expect(config.profile).toBe("balanced");
	});

	it("CLI profile overrides default", () => {
		const config = resolveConfig({ cliProfile: "guardian" });
		expect(config.profile).toBe("guardian");
	});

	it("ignores invalid CLI profile", () => {
		const config = resolveConfig({ cliProfile: "invalid" });
		expect(config.profile).toBe("balanced");
	});

	describe("project config", () => {
		const tmpDir = join(tmpdir(), `clawguard-test-config-${Date.now()}`);

		beforeEach(() => mkdirSync(tmpDir, { recursive: true }));
		afterEach(() => rmSync(tmpDir, { recursive: true, force: true }));

		it("loads .clawguard.yaml from project", () => {
			writeFileSync(join(tmpDir, ".clawguard.yaml"), "profile: expert\n");
			const config = resolveConfig({ projectDir: tmpDir });
			expect(config.profile).toBe("expert");
		});

		it("CLI profile overrides project config", () => {
			writeFileSync(join(tmpDir, ".clawguard.yaml"), "profile: expert\n");
			const config = resolveConfig({ projectDir: tmpDir, cliProfile: "guardian" });
			expect(config.profile).toBe("guardian");
		});

		it("handles non-existent project dir gracefully", () => {
			const config = resolveConfig({ projectDir: "/nonexistent/path" });
			expect(config.profile).toBe("balanced");
		});
	});
});

describe("path helpers", () => {
	it("getGlobalConfigDir returns a path", () => {
		expect(getGlobalConfigDir()).toContain("clawguard");
	});

	it("getLogDir returns a path", () => {
		expect(getLogDir()).toContain(".clawguard");
	});
});
