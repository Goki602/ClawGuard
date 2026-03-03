import type { Env } from "../index.js";

export async function handleReputation(_request: Request, env: Env): Promise<Response> {
	const { results } = await env.DB.prepare(
		"SELECT rule_id, community_total, community_allowed, community_denied, override_rate, last_updated FROM reputation_stats ORDER BY community_total DESC",
	).all<{
		rule_id: string;
		community_total: number;
		community_allowed: number;
		community_denied: number;
		override_rate: number;
		last_updated: string;
	}>();

	const data = {
		version: new Date().toISOString().slice(0, 10).replace(/-/g, "."),
		entries: (results ?? []).map((r) => ({
			rule_id: r.rule_id,
			community_total: r.community_total,
			community_allowed: r.community_allowed,
			community_denied: r.community_denied,
			community_override_rate: r.override_rate,
			last_updated: r.last_updated,
		})),
	};

	return new Response(JSON.stringify(data), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "public, max-age=300",
		},
	});
}
