import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_UI_DIR = resolve(__dirname, "..", "..", "..", "web-ui");

export async function dashboardCommand(options: {
	port?: string;
}): Promise<void> {
	const port = options.port ?? "19281";

	const distIndex = resolve(WEB_UI_DIR, "dist", "index.html");
	if (!existsSync(distIndex)) {
		console.log(chalk.yellow("Building dashboard..."));
		try {
			execFileSync("npm", ["run", "build"], {
				cwd: WEB_UI_DIR,
				stdio: "inherit",
			});
		} catch {
			console.error(chalk.red("Failed to build dashboard. Run from the ClawGuard repo."));
			process.exit(1);
		}
	}

	console.log(chalk.bold("ClawGuard Dashboard"));
	console.log(`  URL: http://localhost:${port}`);
	console.log(chalk.dim("  Make sure 'claw-guard serve' is running for live data"));
	console.log("");

	let preview: typeof import("vite")["preview"];
	try {
		({ preview } = await import("vite"));
	} catch {
		console.error(chalk.red("Dashboard requires vite. Install with: npm install vite"));
		process.exit(1);
	}

	const server = await preview({
		root: WEB_UI_DIR,
		preview: {
			port: Number.parseInt(port, 10),
			open: true,
			host: "127.0.0.1",
		},
	});

	server.printUrls();
}
