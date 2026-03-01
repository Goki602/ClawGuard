import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemberStore } from "../member-store.js";

describe("MemberStore", () => {
	let store: MemberStore;
	let tempDir: string;
	let dbPath: string;

	beforeEach(() => {
		tempDir = mkdtempSync(join(tmpdir(), "clawguard-member-test-"));
		dbPath = join(tempDir, "team.db");
		store = new MemberStore(dbPath);
	});

	afterEach(() => {
		store.close();
		if (existsSync(tempDir)) rmSync(tempDir, { recursive: true });
	});

	it("adds a member and returns api_key", () => {
		const { member, api_key } = store.addMember("alice@example.com", "admin");
		expect(member.email).toBe("alice@example.com");
		expect(member.role).toBe("admin");
		expect(member.id).toBeTruthy();
		expect(api_key).toMatch(/^cg_team_[0-9a-f]{32}$/);
		expect(member.api_key).toBe("");
	});

	it("authenticates with valid api_key", () => {
		const { api_key } = store.addMember("bob@example.com", "member");
		const authed = store.authenticate(api_key);
		expect(authed).not.toBeNull();
		expect(authed?.email).toBe("bob@example.com");
	});

	it("returns null for invalid api_key", () => {
		const authed = store.authenticate("cg_team_invalid");
		expect(authed).toBeNull();
	});

	it("lists all members", () => {
		store.addMember("a@test.com", "admin");
		store.addMember("b@test.com", "member");
		store.addMember("c@test.com", "readonly");
		const members = store.listMembers();
		expect(members.length).toBe(3);
		expect(members.map((m) => m.role)).toContain("admin");
		expect(members.map((m) => m.role)).toContain("member");
		expect(members.map((m) => m.role)).toContain("readonly");
	});

	it("removes a member", () => {
		const { member } = store.addMember("del@test.com", "member");
		expect(store.removeMember(member.id)).toBe(true);
		expect(store.getMember(member.id)).toBeNull();
	});

	it("returns false when removing non-existent member", () => {
		expect(store.removeMember("nonexistent")).toBe(false);
	});

	it("gets a member by id", () => {
		const { member } = store.addMember("get@test.com", "admin");
		const found = store.getMember(member.id);
		expect(found).not.toBeNull();
		expect(found?.email).toBe("get@test.com");
	});

	it("updates last_seen timestamp", () => {
		const { member, api_key } = store.addMember("seen@test.com", "member");
		expect(store.getMember(member.id)?.last_seen).toBeUndefined();
		store.updateLastSeen(member.id);
		const updated = store.getMember(member.id);
		expect(updated?.last_seen).toBeTruthy();
	});
});
