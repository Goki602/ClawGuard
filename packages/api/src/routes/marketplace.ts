import type { Env } from "../index.js";

export async function handleMarketplaceSearch(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const query = url.searchParams.get("q") ?? "";
	const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 100);

	let results: D1Result;
	if (query) {
		results = await env.DB.prepare(
			`SELECT name, description, author, version, rules_count, downloads
       FROM marketplace_packs
       WHERE name LIKE ? OR description LIKE ?
       ORDER BY downloads DESC
       LIMIT ?`,
		)
			.bind(`%${query}%`, `%${query}%`, limit)
			.all();
	} else {
		results = await env.DB.prepare(
			`SELECT name, description, author, version, rules_count, downloads
       FROM marketplace_packs
       ORDER BY downloads DESC
       LIMIT ?`,
		)
			.bind(limit)
			.all();
	}

	return new Response(JSON.stringify({ packs: results.results ?? [] }), {
		headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
	});
}

export async function handleMarketplacePack(
	_request: Request,
	env: Env,
	name: string,
): Promise<Response> {
	const row = await env.DB.prepare(
		"SELECT name, description, author, version, rules_count, downloads, pack_json, created_at FROM marketplace_packs WHERE name = ?",
	)
		.bind(name)
		.first();

	if (!row) {
		return new Response(JSON.stringify({ error: "Pack not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	// Increment download count
	await env.DB.prepare("UPDATE marketplace_packs SET downloads = downloads + 1 WHERE name = ?")
		.bind(name)
		.run();

	return new Response(JSON.stringify(row), {
		headers: { "Content-Type": "application/json" },
	});
}
