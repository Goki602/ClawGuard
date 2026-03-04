import { handleBadge } from "./routes/badge.js";
import { handleMarketplacePack, handleMarketplaceSearch } from "./routes/marketplace.js";
import { handlePassportGet, handlePassportPut } from "./routes/passport.js";
import { handleReputation } from "./routes/reputation.js";
import { handleTelemetry } from "./routes/telemetry.js";

export interface Env {
	DB: D1Database;
	LICENSE_DB: D1Database;
}

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const SECURITY_HEADERS = {
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"Strict-Transport-Security": "max-age=31536000; includeSubDomains",
	"X-XSS-Protection": "0",
	"Referrer-Policy": "strict-origin-when-cross-origin",
};

export default {
	async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: CORS_HEADERS });
		}

		const url = new URL(request.url);
		const path = url.pathname;

		try {
			const response = await route(request, env, path);
			for (const [k, v] of Object.entries({ ...CORS_HEADERS, ...SECURITY_HEADERS })) {
				response.headers.set(k, v);
			}
			return response;
		} catch (e) {
			console.error("Unhandled error:", e);
			return new Response(JSON.stringify({ error: "Internal server error" }), {
				status: 500,
				headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...SECURITY_HEADERS },
			});
		}
	},
};

async function route(request: Request, env: Env, path: string): Promise<Response> {
	// GET /badge/:id
	const badgeMatch = path.match(/^\/badge\/([^/]+)$/);
	if (badgeMatch && request.method === "GET") {
		return handleBadge(request, env, decodeURIComponent(badgeMatch[1]));
	}

	// POST /api/telemetry
	if (path === "/api/telemetry") {
		return handleTelemetry(request, env);
	}

	// GET /api/reputation
	if (path === "/api/reputation" && request.method === "GET") {
		return handleReputation(request, env);
	}

	// GET/PUT /api/passport/:id
	const passportMatch = path.match(/^\/api\/passport\/([^/]+)$/);
	if (passportMatch) {
		const id = decodeURIComponent(passportMatch[1]);
		if (request.method === "GET") return handlePassportGet(request, env, id);
		if (request.method === "PUT") return handlePassportPut(request, env, id);
	}

	// GET /api/marketplace/search
	if (path === "/api/marketplace/search" && request.method === "GET") {
		return handleMarketplaceSearch(request, env);
	}

	// GET /api/marketplace/pack/:name
	const packMatch = path.match(/^\/api\/marketplace\/pack\/([^/]+)$/);
	if (packMatch && request.method === "GET") {
		return handleMarketplacePack(request, env, decodeURIComponent(packMatch[1]));
	}

	return new Response(JSON.stringify({ error: "Not found" }), {
		status: 404,
		headers: { "Content-Type": "application/json" },
	});
}
