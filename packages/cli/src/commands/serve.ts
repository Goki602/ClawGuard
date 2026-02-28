import { type IncomingMessage, type ServerResponse, createServer } from "node:http";
import { AuditReader } from "@clawguard/audit";
import chalk from "chalk";
import { createEngineContext, evaluateHookRequest } from "../engine-factory.js";

const DEFAULT_PORT = 19280;

function corsHeaders(): Record<string, string> {
	return {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
	};
}

function jsonResponse(res: ServerResponse, status: number, data: unknown): void {
	res.writeHead(status, { "Content-Type": "application/json", ...corsHeaders() });
	res.end(JSON.stringify(data));
}

export async function serveCommand(options: { port?: string }): Promise<void> {
	const port = options.port ? Number.parseInt(options.port, 10) : DEFAULT_PORT;
	if (Number.isNaN(port) || port < 1 || port > 65535) {
		console.error("Invalid port number");
		process.exit(1);
	}

	const ctx = createEngineContext();
	const reader = new AuditReader();

	console.log(chalk.bold("ClawGuard HTTP Hook Server"));
	console.log(`  Rules: ${ctx.rulesCount} loaded`);
	console.log(`  Preset: ${ctx.engine.getPreset().name}`);
	console.log(`  Port: ${port}`);
	console.log(`  Hook:      POST http://localhost:${port}/hook`);
	console.log(`  Dashboard: GET  http://localhost:${port}/api/logs/today`);
	console.log("");

	const server = createServer((req: IncomingMessage, res: ServerResponse) => {
		if (req.method === "OPTIONS") {
			res.writeHead(204, corsHeaders());
			res.end();
			return;
		}

		if (req.method === "GET" && req.url === "/health") {
			jsonResponse(res, 200, { status: "ok", rules: ctx.rulesCount });
			return;
		}

		if (req.method === "GET" && req.url === "/api/logs/today") {
			const entries = reader.readToday();
			jsonResponse(res, 200, { entries });
			return;
		}

		if (req.method === "GET" && req.url === "/api/rules") {
			const rules = ctx.engine.getRules().map((r) => ({
				id: r.id,
				tool: r.match.tool,
				regex: r.match.command_regex ?? "",
				risk: r.risk,
				title: r.explain?.title ?? "",
			}));
			jsonResponse(res, 200, { rules });
			return;
		}

		if (req.method === "POST" && req.url === "/hook") {
			let body = "";
			req.on("data", (chunk: Buffer) => {
				body += chunk.toString();
			});
			req.on("end", () => {
				try {
					const { output, skipped } = evaluateHookRequest(body, ctx);
					if (skipped || !output) {
						jsonResponse(res, 200, {});
					} else {
						jsonResponse(res, 200, output);
					}
				} catch (err) {
					console.error("Evaluation error:", err);
					jsonResponse(res, 200, {});
				}
			});
			return;
		}

		jsonResponse(res, 404, { error: "Not found" });
	});

	server.listen(port, "127.0.0.1", () => {
		console.log(chalk.green(`Listening on http://127.0.0.1:${port}`));
		console.log(chalk.dim("Press Ctrl+C to stop"));
	});

	const shutdown = () => {
		console.log("\nShutting down...");
		server.close(() => process.exit(0));
		setTimeout(() => process.exit(0), 3000);
	};
	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);
}
