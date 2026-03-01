import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type TeamServer, createTeamServer } from "../policy-server.js";

const ADMIN_KEY = "test-admin-key-12345";
let server: TeamServer;
let tempDir: string;
let port: number;
let memberApiKey: string;

function url(path: string): string {
	return `http://127.0.0.1:${port}${path}`;
}

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

describe("PolicyServer", () => {
	beforeEach(async () => {
		tempDir = mkdtempSync(join(tmpdir(), "clawguard-server-test-"));
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

	it("returns 401 for unauthenticated policy request", async () => {
		const res = await fetch(url("/api/policy"));
		expect(res.status).toBe(401);
	});

	it("returns 403 for non-admin POST to policy", async () => {
		const res = await fetch(url("/api/policy"), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer wrong-key",
			},
			body: JSON.stringify({ profile: "expert" }),
		});
		expect(res.status).toBe(403);
	});

	it("adds a member via admin and authenticates", async () => {
		const addRes = await fetch(url("/api/members"), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${ADMIN_KEY}`,
			},
			body: JSON.stringify({ email: "test@example.com", role: "member" }),
		});
		expect(addRes.status).toBe(201);
		const { member, api_key } = (await addRes.json()) as {
			member: { id: string; email: string };
			api_key: string;
		};
		expect(member.email).toBe("test@example.com");
		expect(api_key).toMatch(/^cg_team_/);
		memberApiKey = api_key;
	});

	it("fetches policy with valid member api_key", async () => {
		const addRes = await fetch(url("/api/members"), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${ADMIN_KEY}`,
			},
			body: JSON.stringify({ email: "pol@test.com", role: "member" }),
		});
		const { api_key } = (await addRes.json()) as { api_key: string };

		const polRes = await fetch(url("/api/policy"), {
			headers: { Authorization: `Bearer ${api_key}` },
		});
		expect(polRes.status).toBe(200);
		const policy = (await polRes.json()) as { profile: string };
		expect(policy.profile).toBe("balanced");
	});

	it("updates policy as admin", async () => {
		const res = await fetch(url("/api/policy"), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${ADMIN_KEY}`,
			},
			body: JSON.stringify({ profile: "expert", enforce: false }),
		});
		expect(res.status).toBe(200);
		const body = (await res.json()) as { profile: string; enforce: boolean };
		expect(body.profile).toBe("expert");
		expect(body.enforce).toBe(false);
	});

	it("lists members as admin", async () => {
		await fetch(url("/api/members"), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${ADMIN_KEY}`,
			},
			body: JSON.stringify({ email: "list@test.com", role: "admin" }),
		});

		const res = await fetch(url("/api/members"), {
			headers: { Authorization: `Bearer ${ADMIN_KEY}` },
		});
		expect(res.status).toBe(200);
		const members = (await res.json()) as Array<{ email: string }>;
		expect(members.length).toBeGreaterThanOrEqual(1);
	});

	it("deletes a member as admin", async () => {
		const addRes = await fetch(url("/api/members"), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${ADMIN_KEY}`,
			},
			body: JSON.stringify({ email: "del@test.com", role: "member" }),
		});
		const { member } = (await addRes.json()) as {
			member: { id: string };
		};

		const delRes = await fetch(url(`/api/members/${member.id}`), {
			method: "DELETE",
			headers: { Authorization: `Bearer ${ADMIN_KEY}` },
		});
		expect(delRes.status).toBe(200);
		const body = (await delRes.json()) as { deleted: boolean };
		expect(body.deleted).toBe(true);
	});

	it("submits audit events and retrieves summary", async () => {
		const addRes = await fetch(url("/api/members"), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${ADMIN_KEY}`,
			},
			body: JSON.stringify({ email: "audit@test.com", role: "member" }),
		});
		const { api_key, member } = (await addRes.json()) as {
			api_key: string;
			member: { id: string };
		};

		await fetch(url("/api/audit"), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${api_key}`,
			},
			body: JSON.stringify({
				events: [
					{
						member_id: member.id,
						rule_id: "BASH.RM_RISK",
						action: "deny",
						timestamp: new Date().toISOString(),
						content_hash: "abc123",
					},
				],
			}),
		});

		const summaryRes = await fetch(url("/api/audit/summary"), {
			headers: { Authorization: `Bearer ${ADMIN_KEY}` },
		});
		expect(summaryRes.status).toBe(200);
		const summary = (await summaryRes.json()) as { total: number };
		expect(summary.total).toBeGreaterThanOrEqual(1);
	});

	it("submits memory snapshot and retrieves stats", async () => {
		const addRes = await fetch(url("/api/members"), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${ADMIN_KEY}`,
			},
			body: JSON.stringify({ email: "mem@test.com", role: "member" }),
		});
		const { api_key } = (await addRes.json()) as { api_key: string };

		await fetch(url("/api/memory/snapshot"), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${api_key}`,
			},
			body: JSON.stringify({
				stats: [{ rule_id: "BASH.RM_RISK", total: 10, allowed: 7, denied: 3 }],
			}),
		});

		const statsRes = await fetch(url("/api/memory/stats"), {
			headers: { Authorization: `Bearer ${api_key}` },
		});
		expect(statsRes.status).toBe(200);
		const stats = (await statsRes.json()) as Array<{ rule_id: string }>;
		expect(stats.length).toBeGreaterThanOrEqual(1);
	});

	it("returns 404 for unknown routes", async () => {
		const res = await fetch(url("/api/unknown"));
		expect(res.status).toBe(404);
	});
});
