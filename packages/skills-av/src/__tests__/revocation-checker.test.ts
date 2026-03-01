import type { RevocationList, SkillManifest } from "@clawguard/core";
import { describe, expect, it } from "vitest";
import { RevocationChecker } from "../revocation-checker.js";

const REVOKED_HASH = "sha256:deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
const CLEAN_HASH = "sha256:cafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe";

function makeRevocations(): RevocationList {
	return {
		version: "1",
		entries: [
			{
				hash: REVOKED_HASH,
				reason: "Malicious payload detected",
				revoked_at: "2026-03-01T00:00:00Z",
			},
		],
	};
}

function makeManifest(hashes: string[]): SkillManifest {
	return {
		version: "2026-03-01",
		generated_at: "2026-03-01T00:00:00Z",
		skills: hashes.map((hash, i) => ({
			name: `skill-${i}`,
			path: `skills/skill-${i}`,
			hash,
			files: 1,
			has_exec: false,
			last_verified: "2026-03-01T00:00:00Z",
		})),
	};
}

describe("RevocationChecker", () => {
	it("isRevoked returns entry for revoked hash", () => {
		const checker = new RevocationChecker(makeRevocations());
		const result = checker.isRevoked(REVOKED_HASH);
		expect(result).not.toBeNull();
		expect(result?.reason).toBe("Malicious payload detected");
	});

	it("isRevoked returns null for clean hash", () => {
		const checker = new RevocationChecker(makeRevocations());
		const result = checker.isRevoked(CLEAN_HASH);
		expect(result).toBeNull();
	});

	it("checkManifest marks revoked skills", () => {
		const checker = new RevocationChecker(makeRevocations());
		const manifest = makeManifest([REVOKED_HASH]);
		const results = checker.checkManifest(manifest);

		expect(results).toHaveLength(1);
		expect(results[0].status).toBe("revoked");
		expect(results[0].findings).toHaveLength(1);
		expect(results[0].findings[0].type).toBe("revoked_hash");
		expect(results[0].findings[0].severity).toBe("high");
	});

	it("checkManifest passes clean skills", () => {
		const checker = new RevocationChecker(makeRevocations());
		const manifest = makeManifest([CLEAN_HASH]);
		const results = checker.checkManifest(manifest);

		expect(results).toHaveLength(1);
		expect(results[0].status).toBe("clean");
		expect(results[0].findings).toHaveLength(0);
	});

	it("updateRevocations replaces list", () => {
		const checker = new RevocationChecker();
		expect(checker.isRevoked(REVOKED_HASH)).toBeNull();

		checker.updateRevocations(makeRevocations());
		expect(checker.isRevoked(REVOKED_HASH)).not.toBeNull();
	});
});
