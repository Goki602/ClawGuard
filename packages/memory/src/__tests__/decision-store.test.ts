import { existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DecisionStore } from "../decision-store.js";

const TEST_DB = join(tmpdir(), `clawguard-test-${Date.now()}.db`);

describe("DecisionStore", () => {
	let store: DecisionStore;

	beforeEach(() => {
		store = new DecisionStore(TEST_DB);
	});

	afterEach(() => {
		store.close();
		if (existsSync(TEST_DB)) rmSync(TEST_DB);
		if (existsSync(`${TEST_DB}-wal`)) rmSync(`${TEST_DB}-wal`);
		if (existsSync(`${TEST_DB}-shm`)) rmSync(`${TEST_DB}-shm`);
	});

	it("records and retrieves stats", () => {
		store.record({ rule_id: "BASH.RM_RISK", action: "confirm", content_hash: "abc123" });
		store.record({ rule_id: "BASH.RM_RISK", action: "allow", content_hash: "def456" });
		store.record({ rule_id: "BASH.RM_RISK", action: "deny", content_hash: "ghi789" });

		const stats = store.getStats("BASH.RM_RISK");
		expect(stats.total).toBe(3);
		expect(stats.confirmed).toBe(1);
		expect(stats.allowed).toBe(1);
		expect(stats.denied).toBe(1);
	});

	it("returns zero stats for unknown rule", () => {
		const stats = store.getStats("UNKNOWN");
		expect(stats.total).toBe(0);
		expect(stats.override_rate).toBe(0);
	});

	it("calculates override_rate correctly", () => {
		store.record({ rule_id: "R1", action: "allow", content_hash: "a" });
		store.record({ rule_id: "R1", action: "allow", content_hash: "b" });
		store.record({ rule_id: "R1", action: "confirm", content_hash: "c" });
		store.record({ rule_id: "R1", action: "deny", content_hash: "d" });

		const rate = store.getOverrideRate("R1");
		expect(rate).toBe(0.5);
	});

	it("retrieves recent decisions by content hash", () => {
		const hash = DecisionStore.hashContent("npm install lodash");
		store.record({
			rule_id: "BASH.NPM_INSTALL",
			action: "confirm",
			content_hash: hash,
			agent: "claude",
		});
		store.record({
			rule_id: "BASH.NPM_INSTALL",
			action: "allow",
			content_hash: hash,
			agent: "claude",
		});

		const recent = store.getRecentByHash(hash);
		expect(recent.length).toBe(2);
		expect(recent[0].action).toBe("allow");
		expect(recent[1].action).toBe("confirm");
	});

	it("hashes content deterministically", () => {
		const h1 = DecisionStore.hashContent("npm install lodash");
		const h2 = DecisionStore.hashContent("npm install lodash");
		const h3 = DecisionStore.hashContent("npm install express");
		expect(h1).toBe(h2);
		expect(h1).not.toBe(h3);
		expect(h1.length).toBe(16);
	});

	it("records with optional fields", () => {
		store.record({
			rule_id: "R1",
			action: "confirm",
			content_hash: "abc",
			user_response: "allowed",
			agent: "claude",
			session_id: "sess-1",
		});

		const recent = store.getRecentByHash("abc");
		expect(recent.length).toBe(1);
		expect(recent[0].user_response).toBe("allowed");
		expect(recent[0].agent).toBe("claude");
		expect(recent[0].session_id).toBe("sess-1");
	});

	describe("session allowlist", () => {
		it("returns false when no entry exists", () => {
			expect(store.isSessionAllowed("s1", "hash1", "BASH.NPM_INSTALL")).toBe(false);
		});

		it("returns true after recording", () => {
			store.recordSessionAllow("s1", "hash1", "BASH.NPM_INSTALL");
			expect(store.isSessionAllowed("s1", "hash1", "BASH.NPM_INSTALL")).toBe(true);
		});

		it("does not match different session", () => {
			store.recordSessionAllow("s1", "hash1", "BASH.NPM_INSTALL");
			expect(store.isSessionAllowed("s2", "hash1", "BASH.NPM_INSTALL")).toBe(false);
		});

		it("does not match different content hash", () => {
			store.recordSessionAllow("s1", "hash1", "BASH.NPM_INSTALL");
			expect(store.isSessionAllowed("s1", "hash2", "BASH.NPM_INSTALL")).toBe(false);
		});

		it("does not match different rule", () => {
			store.recordSessionAllow("s1", "hash1", "BASH.NPM_INSTALL");
			expect(store.isSessionAllowed("s1", "hash1", "BASH.PIP_INSTALL")).toBe(false);
		});

		it("handles duplicate inserts gracefully", () => {
			store.recordSessionAllow("s1", "hash1", "BASH.NPM_INSTALL");
			store.recordSessionAllow("s1", "hash1", "BASH.NPM_INSTALL");
			expect(store.isSessionAllowed("s1", "hash1", "BASH.NPM_INSTALL")).toBe(true);
		});

		it("cleanExpiredSessions does not remove recent entries", () => {
			store.recordSessionAllow("s1", "hash1", "BASH.NPM_INSTALL");
			store.cleanExpiredSessions(24);
			expect(store.isSessionAllowed("s1", "hash1", "BASH.NPM_INSTALL")).toBe(true);
		});
	});
});
