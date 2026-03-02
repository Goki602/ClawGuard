import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { detectLocale } from "../locale.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_UI_DIR = resolve(__dirname, "..", "..", "..", "web-ui");

const MSG = {
	ja: {
		building: "ダッシュボードをビルド中...",
		buildFailed: "ダッシュボードのビルドに失敗。ClawGuardリポジトリから実行してください。",
		title: "ClawGuard Dashboard",
		url: (port: string) => `  URL: http://localhost:${port}`,
		serveHint: "ライブデータには 'claw-guard serve' の実行が必要です",
		viteRequired: "ダッシュボードにはviteが必要です: npm install vite",
	},
	en: {
		building: "Building dashboard...",
		buildFailed: "Failed to build dashboard. Run from the ClawGuard repo.",
		title: "ClawGuard Dashboard",
		url: (port: string) => `  URL: http://localhost:${port}`,
		serveHint: "Make sure 'claw-guard serve' is running for live data",
		viteRequired: "Dashboard requires vite. Install with: npm install vite",
	},
};

export async function dashboardCommand(options: {
	port?: string;
}): Promise<void> {
	const m = MSG[detectLocale()];
	const port = options.port ?? "19281";

	const distIndex = resolve(WEB_UI_DIR, "dist", "index.html");
	if (!existsSync(distIndex)) {
		console.log(chalk.yellow(m.building));
		try {
			execFileSync("npm", ["run", "build"], {
				cwd: WEB_UI_DIR,
				stdio: "inherit",
			});
		} catch {
			console.error(chalk.red(m.buildFailed));
			process.exit(1);
		}
	}

	console.log(chalk.bold(m.title));
	console.log(m.url(port));
	console.log(chalk.dim(`  ${m.serveHint}`));
	console.log("");

	let preview: typeof import("vite")["preview"];
	try {
		({ preview } = await import("vite"));
	} catch {
		console.error(chalk.red(m.viteRequired));
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
