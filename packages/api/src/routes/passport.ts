import type { Env } from "../index.js";

export async function handlePassportGet(
	_request: Request,
	env: Env,
	id: string,
): Promise<Response> {
	const row = await env.DB.prepare(
		"SELECT passport_json, updated_at FROM passports WHERE project_id = ?",
	)
		.bind(id)
		.first<{ passport_json: string; updated_at: string }>();

	if (!row) {
		return new Response(JSON.stringify({ error: "Not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	return new Response(row.passport_json, {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "public, max-age=300",
			"Last-Modified": row.updated_at,
		},
	});
}

export async function handlePassportPut(request: Request, env: Env, id: string): Promise<Response> {
	// Bearer token kept for spam prevention (no license validation)
	const authHeader = request.headers.get("Authorization");
	const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";

	let passport: { repository?: string };
	try {
		passport = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: "Invalid JSON" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	await env.DB.prepare(
		`INSERT INTO passports (project_id, repository, passport_json, license_key, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(project_id) DO UPDATE SET
       repository = excluded.repository,
       passport_json = excluded.passport_json,
       license_key = excluded.license_key,
       updated_at = datetime('now')`,
	)
		.bind(id, passport.repository ?? "", JSON.stringify(passport), token)
		.run();

	return new Response(JSON.stringify({ ok: true, project_id: id }), {
		headers: { "Content-Type": "application/json" },
	});
}
