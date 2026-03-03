import type { Env } from "../index.js";
import { checkRateLimit } from "../lib/rate-limit.js";

interface SnapshotEntry {
	rule_id: string;
	total: number;
	allowed: number;
	denied: number;
}

interface AnonymizedSnapshot {
	generated_at: string;
	entries: SnapshotEntry[];
}

export async function handleTelemetry(request: Request, env: Env): Promise<Response> {
	if (request.method !== "POST") {
		return new Response("Method not allowed", { status: 405 });
	}

	const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
	const allowed = await checkRateLimit(env.DB, `telemetry:${ip}`);
	if (!allowed) {
		return new Response("Rate limited", { status: 429 });
	}

	let snapshot: AnonymizedSnapshot;
	try {
		snapshot = await request.json();
	} catch {
		return new Response("Invalid JSON", { status: 400 });
	}

	if (!snapshot.generated_at || !Array.isArray(snapshot.entries)) {
		return new Response("Invalid snapshot format", { status: 400 });
	}

	// Store raw snapshot
	await env.DB.prepare("INSERT INTO telemetry_snapshots (snapshot_json) VALUES (?)")
		.bind(JSON.stringify(snapshot))
		.run();

	// Update aggregated reputation stats
	const stmts = snapshot.entries.map((entry) =>
		env.DB.prepare(
			`INSERT INTO reputation_stats (rule_id, community_total, community_allowed, community_denied, override_rate, last_updated)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(rule_id) DO UPDATE SET
         community_total = community_total + excluded.community_total,
         community_allowed = community_allowed + excluded.community_allowed,
         community_denied = community_denied + excluded.community_denied,
         override_rate = CAST(community_allowed + excluded.community_allowed AS REAL) / MAX(community_total + excluded.community_total, 1),
         last_updated = datetime('now')`,
		).bind(
			entry.rule_id,
			entry.total,
			entry.allowed,
			entry.denied,
			entry.total > 0 ? entry.allowed / entry.total : 0,
		),
	);

	if (stmts.length > 0) {
		await env.DB.batch(stmts);
	}

	return new Response(JSON.stringify({ ok: true }), {
		headers: { "Content-Type": "application/json" },
	});
}
