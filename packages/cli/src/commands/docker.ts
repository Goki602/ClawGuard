import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import chalk from "chalk";

function getTemplateDir(): string {
	const candidates = [resolve(import.meta.dirname, "../../../docker")];
	for (const c of candidates) {
		if (existsSync(c)) return c;
	}
	return candidates[0];
}

function runCompose(args: string[], cwd: string): void {
	try {
		execFileSync("docker", ["compose", ...args], { cwd, stdio: "inherit" });
	} catch {
		console.error(chalk.red(`docker compose ${args.join(" ")} failed`));
		process.exit(1);
	}
}

export function dockerCommand(action?: string): void {
	const cwd = process.cwd();

	switch (action) {
		case "init": {
			const destDir = resolve(cwd, "clawguard-docker");
			if (existsSync(destDir)) {
				console.error(chalk.yellow("clawguard-docker/ already exists"));
				return;
			}
			const templateDir = getTemplateDir();
			if (!existsSync(templateDir)) {
				console.error(chalk.red("Docker templates not found"));
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
			console.log(chalk.green("Docker templates copied to clawguard-docker/"));
			console.log("  Next: cd clawguard-docker && docker compose up -d");
			break;
		}
		case "up": {
			const composeFile = resolve(cwd, "docker-compose.yml");
			if (!existsSync(composeFile)) {
				console.error(
					chalk.red("No docker-compose.yml found. Run 'claw-guard docker init' first."),
				);
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
			console.log(chalk.bold("ClawGuard Docker Commands:"));
			console.log("  claw-guard docker init     Copy Docker templates to current directory");
			console.log("  claw-guard docker up       Start containers (docker compose up -d)");
			console.log("  claw-guard docker down     Stop containers (docker compose down)");
			console.log("  claw-guard docker logs     Show container logs");
			console.log("  claw-guard docker status   Show container status");
			break;
	}
}
