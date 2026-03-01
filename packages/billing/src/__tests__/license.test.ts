import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LicenseManager, parseKey } from "../license.js";

describe("parseKey", () => {
	it("parses valid pro key", () => {
		const result = parseKey("cg_pro_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4");
		expect(result).toEqual({ plan: "pro", id: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4" });
	});

	it("parses valid max key", () => {
		const result = parseKey("cg_max_00000000000000000000000000000000");
		expect(result).toEqual({ plan: "max", id: "00000000000000000000000000000000" });
	});

	it("parses valid free key", () => {
		const result = parseKey("cg_free_aaaabbbbccccddddaaaabbbbccccdddd");
		expect(result).toEqual({ plan: "free", id: "aaaabbbbccccddddaaaabbbbccccdddd" });
	});

	it("rejects invalid format", () => {
		expect(parseKey("invalid")).toBeNull();
		expect(parseKey("cg_pro_short")).toBeNull();
		expect(parseKey("cg_enterprise_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4")).toBeNull();
		expect(parseKey("")).toBeNull();
	});
});

describe("LicenseManager", () => {
	let tmpDir: string;
	let manager: LicenseManager;

	beforeEach(() => {
		tmpDir = mkdtempSync(join(tmpdir(), "cg-license-"));
		manager = new LicenseManager(tmpDir);
	});

	afterEach(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	it("returns free license when no key exists", () => {
		const license = manager.getCurrentLicense();
		expect(license.plan).toBe("free");
		expect(license.features.max_rules).toBe(12);
		expect(license.features.reputation_network).toBe(false);
	});

	it("validates and saves pro key", () => {
		const key = "cg_pro_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4";
		const license = manager.saveLicense(key);
		expect(license.plan).toBe("pro");
		expect(license.key).toBe(key);
		expect(license.features.reputation_network).toBe(true);
		expect(license.features.marketplace).toBe(true);
		expect(license.features.feed_interval).toBe("daily");
	});

	it("reads saved license", () => {
		const key = "cg_max_00000000000000000000000000000000";
		manager.saveLicense(key);
		const license = manager.getCurrentLicense();
		expect(license.plan).toBe("max");
		expect(license.features.max_rules).toBe(Number.MAX_SAFE_INTEGER);
	});

	it("returns free for invalid saved key", () => {
		writeFileSync(join(tmpDir, "license.json"), '{"key":"bad"}', "utf-8");
		const license = manager.getCurrentLicense();
		expect(license.plan).toBe("free");
	});

	it("returns free for corrupted file", () => {
		writeFileSync(join(tmpDir, "license.json"), "not-json", "utf-8");
		const license = manager.getCurrentLicense();
		expect(license.plan).toBe("free");
	});
});
