import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import chalk from "chalk";
import { detectLocale } from "../locale.js";

const MSG = {
	ja: {
		composeFailed: (args: string) => `docker compose ${args} に失敗`,
		alreadyExists: "clawguard-docker/ は既に存在します",
		templatesNotFound: "Docker テンプレートが見つかりません",
		copied: "Docker テンプレートを clawguard-docker/ にコピーしました",
		next: "次のステップ: cd clawguard-docker && docker compose up -d",
		noCompose:
			"docker-compose.yml が見つかりません。先に 'claw-guard docker init' を実行してください。",
		helpTitle: "ClawGuard Docker コマンド:",
		helpInit: "  claw-guard docker init     Docker テンプレートをカレントディレクトリにコピー",
		helpUp: "  claw-guard docker up       コンテナを起動 (docker compose up -d)",
		helpDown: "  claw-guard docker down     コンテナを停止 (docker compose down)",
		helpLogs: "  claw-guard docker logs     コンテナログを表示",
		helpStatus: "  claw-guard docker status   コンテナ状態を表示",
	},
	en: {
		composeFailed: (args: string) => `docker compose ${args} failed`,
		alreadyExists: "clawguard-docker/ already exists",
		templatesNotFound: "Docker templates not found",
		copied: "Docker templates copied to clawguard-docker/",
		next: "Next: cd clawguard-docker && docker compose up -d",
		noCompose: "No docker-compose.yml found. Run 'claw-guard docker init' first.",
		helpTitle: "ClawGuard Docker Commands:",
		helpInit: "  claw-guard docker init     Copy Docker templates to current directory",
		helpUp: "  claw-guard docker up       Start containers (docker compose up -d)",
		helpDown: "  claw-guard docker down     Stop containers (docker compose down)",
		helpLogs: "  claw-guard docker logs     Show container logs",
		helpStatus: "  claw-guard docker status   Show container status",
	},
};

function getTemplateDir(): string {
	const candidates = [resolve(import.meta.dirname, "../../../docker")];
	for (const c of candidates) {
		if (existsSync(c)) return c;
	}
	return candidates[0];
}

function runCompose(args: string[], cwd: string): void {
	const m = MSG[detectLocale()];
	try {
		execFileSync("docker", ["compose", ...args], { cwd, stdio: "inherit" });
	} catch {
		console.error(chalk.red(m.composeFailed(args.join(" "))));
		process.exit(1);
	}
}

export function dockerCommand(action?: string): void {
	const m = MSG[detectLocale()];
	const cwd = process.cwd();

	switch (action) {
		case "init": {
			const destDir = resolve(cwd, "clawguard-docker");
			if (existsSync(destDir)) {
				console.error(chalk.yellow(m.alreadyExists));
				return;
			}
			const templateDir = getTemplateDir();
			if (!existsSync(templateDir)) {
				console.error(chalk.red(m.templatesNotFound));
				process.exit(1);
			}
			mkdirSync(destDir, { recursive: true });
			cpSync(templateDir, destDir, {
				recursive: true,
				filter: (src) =>
					!src.includes("node_modules") &&
					!src.includes("package.json") &&
					!src.includes("tsconfig"),
			});
			console.log(chalk.green(m.copied));
			console.log(`  ${m.next}`);
			break;
		}
		case "up": {
			const composeFile = resolve(cwd, "docker-compose.yml");
			if (!existsSync(composeFile)) {
				console.error(chalk.red(m.noCompose));
				process.exit(1);
			}
			runCompose(["up", "-d"], cwd);
			break;
		}
		case "down": {
			runCompose(["down"], cwd);
			break;
		}
		case "logs": {
			runCompose(["logs", "--tail=50"], cwd);
			break;
		}
		case "status": {
			runCompose(["ps"], cwd);
			break;
		}
		default:
			console.log(chalk.bold(m.helpTitle));
			console.log(m.helpInit);
			console.log(m.helpUp);
			console.log(m.helpDown);
			console.log(m.helpLogs);
			console.log(m.helpStatus);
			break;
	}
}
