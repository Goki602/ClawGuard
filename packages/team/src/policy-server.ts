import { type IncomingMessage, type Server, type ServerResponse, createServer } from "node:http";
import type { TeamPolicy } from "@clawguard/core";
import { MemberStore } from "./member-store.js";
import { type AuditEvent, TeamAuditStore } from "./team-audit-store.js";
import { type SnapshotEntry, TeamMemoryStore } from "./team-memory-store.js";

export interface TeamServerConfig {
	admin_key: string;
	db_path?: string;
	audit_db_path?: string;
	memory_db_path?: string;
}

export interface TeamServer {
	server: Server;
	start(port: number): Promise<void>;
	stop(): Promise<void>;
}

async function readBody(req: IncomingMessage): Promise<string> {
	const chunks: Buffer[] = [];
	for await (const chunk of req) {
		chunks.push(chunk as Buffer);
	}
	return Buffer.concat(chunks).toString("utf-8");
}

function json(res: ServerResponse, status: number, data: unknown): void {
	res.writeHead(status, { "Content-Type": "application/json" });
	res.end(JSON.stringify(data));
}

function getBearer(req: IncomingMessage): string | null {
	const auth = req.headers.authorization;
	if (!auth?.startsWith("Bearer ")) return null;
	return auth.slice(7);
}

function extractPathSegments(url: string): string[] {
	const pathname = url.split("?")[0];
	return pathname.split("/").filter(Boolean);
}

export function createTeamServer(config: TeamServerConfig): TeamServer {
	const memberStore = new MemberStore(config.db_path);
	const auditStore = new TeamAuditStore(config.audit_db_path);
	const memoryStore = new TeamMemoryStore(config.memory_db_path);

	let currentPolicy: TeamPolicy = {
		version: "1.0.0",
		profile: "balanced",
		project_overrides: [],
		enforce: true,
		allowed_plans: ["pro", "max"],
	};

	function authenticateAdmin(req: IncomingMessage): boolean {
		return getBearer(req) === config.admin_key;
	}

	function authenticateMember(req: IncomingMessage): { id: string } | null {
		const key = getBearer(req);
		if (!key) return null;
		const member = memberStore.authenticate(key);
		if (!member) return null;
		memberStore.updateLastSeen(member.id);
		return { id: member.id };
	}

	const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
		try {
			const method = req.method ?? "GET";
			const segments = extractPathSegments(req.url ?? "/");
			const route = `/${segments.join("/")}`;

			if (route === "/api/policy" && method === "GET") {
				const member = authenticateMember(req);
				if (!member) {
					json(res, 401, { error: "Unauthorized" });
					return;
				}
				json(res, 200, currentPolicy);
				return;
			}

			if (route === "/api/policy" && method === "POST") {
				if (!authenticateAdmin(req)) {
					json(res, 403, { error: "Forbidden" });
					return;
				}
				const body = JSON.parse(await readBody(req)) as Partial<TeamPolicy>;
				currentPolicy = { ...currentPolicy, ...body };
				json(res, 200, currentPolicy);
				return;
			}

			if (route === "/api/members" && method === "GET") {
				if (!authenticateAdmin(req)) {
					json(res, 403, { error: "Forbidden" });
					return;
				}
				const members = memberStore.listMembers();
				json(res, 200, members);
				return;
			}

			if (route === "/api/members" && method === "POST") {
				if (!authenticateAdmin(req)) {
					json(res, 403, { error: "Forbidden" });
					return;
				}
				const body = JSON.parse(await readBody(req)) as {
					email: string;
					role: string;
				};
				const result = memberStore.addMember(
					body.email,
					body.role as "admin" | "member" | "readonly",
				);
				json(res, 201, result);
				return;
			}

			if (
				segments[0] === "api" &&
				segments[1] === "members" &&
				segments.length === 3 &&
				method === "DELETE"
			) {
				if (!authenticateAdmin(req)) {
					json(res, 403, { error: "Forbidden" });
					return;
				}
				const memberId = segments[2];
				const removed = memberStore.removeMember(memberId);
				if (!removed) {
					json(res, 404, { error: "Member not found" });
					return;
				}
				json(res, 200, { deleted: true });
				return;
			}

			if (route === "/api/audit" && method === "POST") {
				const member = authenticateMember(req);
				if (!member) {
					json(res, 401, { error: "Unauthorized" });
					return;
				}
				const body = JSON.parse(await readBody(req)) as {
					events: AuditEvent[];
				};
				auditStore.submitBatch(body.events);
				json(res, 200, { ok: true });
				return;
			}

			if (route === "/api/audit/summary" && method === "GET") {
				if (!authenticateAdmin(req)) {
					json(res, 403, { error: "Forbidden" });
					return;
				}
				const url = new URL(req.url ?? "/", "http://localhost");
				const since = url.searchParams.get("since") ?? undefined;
				const summary = auditStore.getSummary(since);
				json(res, 200, summary);
				return;
			}

			if (route === "/api/memory/snapshot" && method === "POST") {
				const member = authenticateMember(req);
				if (!member) {
					json(res, 401, { error: "Unauthorized" });
					return;
				}
				const body = JSON.parse(await readBody(req)) as {
					stats: SnapshotEntry[];
				};
				memoryStore.submitSnapshot(member.id, body.stats);
				json(res, 200, { ok: true });
				return;
			}

			if (route === "/api/memory/stats" && method === "GET") {
				const member = authenticateMember(req);
				if (!member) {
					json(res, 401, { error: "Unauthorized" });
					return;
				}
				const stats = memoryStore.getTeamStats();
				json(res, 200, stats);
				return;
			}

			json(res, 404, { error: "Not found" });
		} catch (err) {
			json(res, 500, {
				error: err instanceof Error ? err.message : "Internal server error",
			});
		}
	});

	return {
		server,
		start(port: number): Promise<void> {
			return new Promise((resolve) => {
				server.listen(port, () => resolve());
			});
		},
		stop(): Promise<void> {
			return new Promise((resolve, reject) => {
				memberStore.close();
				auditStore.close();
				memoryStore.close();
				server.close((err) => {
					if (err) reject(err);
					else resolve();
				});
			});
		},
	};
}
