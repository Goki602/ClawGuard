import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PolicyClient } from "../policy-client.js";
import { type TeamServer, createTeamServer } from "../policy-server.js";

const ADMIN_KEY = "client-test-admin-key";
let server: TeamServer;
let tempDir: string;
let port: number;

async function getRandomPort(): Promise<number> {
	const { createServer } = await import("node:net");
	return new Promise((resolve) => {
		const srv = createServer();
		srv.listen(0, () => {
			const addr = srv.address();
			const p = typeof addr === "object" && addr ? addr.port : 0;
			srv.close(() => resolve(p));
		});
	});
}

async function createMember(email: string): Promise<string> {
	const res = await fetch(`http://127.0.0.1:${port}/api/members`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${ADMIN_KEY}`,
		},
		body: JSON.stringify({ email, role: "member" }),
	});
	const { api_key } = (await res.json()) as { api_key: string };
	return api_key;
}

describe("PolicyClient", () => {
	beforeEach(async () => {
		tempDir = mkdtempSync(join(tmpdir(), "clawguard-client-test-"));
		port = await getRandomPort();
		server = createTeamServer({
			admin_key: ADMIN_KEY,
			db_path: join(tempDir, "members.db"),
			audit_db_path: join(tempDir, "audit.db"),
			memory_db_path: join(tempDir, "memory.db"),
		});
		await server.start(port);
	});

	afterEach(async () => {
		await server.stop();
		if (existsSync(tempDir)) rmSync(tempDir, { recursive: true });
	});

	it("fetches policy successfully", async () => {
		const api_key = await createMember("cli1@test.com");
		const client = new PolicyClient({
			team_id: "t1",
			api_key,
			server_url: `http://127.0.0.1:${port}`,
		});
		const policy = await client.fetchPolicy();
		expect(policy).not.toBeNull();
		expect(policy?.profile).toBe("balanced");
	});

	it("returns null for invalid api_key", async () => {
		const client = new PolicyClient({
			team_id: "t1",
			api_key: "invalid_key",
			server_url: `http://127.0.0.1:${port}`,
		});
		const policy = await client.fetchPolicy();
		expect(policy).toBeNull();
	});

	it("returns null when server is unreachable", async () => {
		const client = new PolicyClient({
			team_id: "t1",
			api_key: "any",
			server_url: "http://127.0.0.1:1",
		});
		const policy = await client.fetchPolicy();
		expect(policy).toBeNull();
	});

	it("submits audit events without throwing", async () => {
		const api_key = await createMember("cli2@test.com");
		const client = new PolicyClient({
			team_id: "t1",
			api_key,
			server_url: `http://127.0.0.1:${port}`,
		});
		await expect(
			client.submitAudit([
				{
					member_id: "m1",
					rule_id: "BASH.RM_RISK",
					action: "deny",
					timestamp: new Date().toISOString(),
					content_hash: "abc",
				},
			]),
		).resolves.toBeUndefined();
	});

	it("submits snapshot and retrieves memory stats", async () => {
		const api_key = await createMember("cli3@test.com");
		const client = new PolicyClient({
			team_id: "t1",
			api_key,
			server_url: `http://127.0.0.1:${port}`,
		});
		await client.submitSnapshot([{ rule_id: "R1", total: 5, allowed: 3, denied: 2 }]);
		const stats = await client.getMemoryStats();
		expect(stats.length).toBeGreaterThanOrEqual(1);
		expect(stats[0].rule_id).toBe("R1");
	});
});
