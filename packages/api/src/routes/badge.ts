import type { Env } from "../index.js";
import { generateBadgeSvg } from "../lib/badge-svg.js";

export async function handleBadge(request: Request, env: Env, id: string): Promise<Response> {
	const row = await env.DB.prepare("SELECT passport_json FROM passports WHERE project_id = ?")
		.bind(id)
		.first<{ passport_json: string }>();

	if (!row) {
		const svg = generateBadgeSvg("Not Found", 0);
		return new Response(svg, {
			status: 404,
			headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=300" },
		});
	}

	const passport = JSON.parse(row.passport_json) as { summary: { incidents: number } };
	const incidents = passport.summary.incidents;
	const statusText =
		incidents === 0 ? "Monitored" : `${incidents} incident${incidents > 1 ? "s" : ""}`;
	const svg = generateBadgeSvg(statusText, incidents);

	return new Response(svg, {
		headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
	});
}
