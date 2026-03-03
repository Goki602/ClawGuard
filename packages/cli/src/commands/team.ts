import { MemberStore, createTeamServer } from "@clawguard/team";
import chalk from "chalk";
import { detectLocale } from "../locale.js";

const MSG = {
	ja: {
		noAdminKey: "エラー: --admin-key が必要です",
		serverStarted: (port: number) => `チームサーバー起動: http://127.0.0.1:${port}`,
		stop: "Ctrl+C で停止",
		memberAdded: "メンバー追加完了",
		apiKeyOnce: "API キー（この1回だけ表示されます）:",
		memberRemoved: "メンバー削除完了",
		memberNotFound: "メンバーが見つかりません",
		noMembers: "メンバーなし",
		policyUpdated: "ポリシー更新完了",
		unknownAction: (a: string) =>
			`不明なアクション: ${a}。serve / add / list / remove / policy を使用してください`,
	},
	en: {
		noAdminKey: "Error: --admin-key is required",
		serverStarted: (port: number) => `Team server started: http://127.0.0.1:${port}`,
		stop: "Press Ctrl+C to stop",
		memberAdded: "Member added",
		apiKeyOnce: "API key (shown only once):",
		memberRemoved: "Member removed",
		memberNotFound: "Member not found",
		noMembers: "No members",
		policyUpdated: "Policy updated",
		unknownAction: (a: string) => `Unknown action: ${a}. Use serve / add / list / remove / policy`,
	},
};

export async function teamCommand(
	action: string,
	target: string | undefined,
	options: {
		adminKey?: string;
		port?: string;
		role?: string;
		profile?: string;
		enforce?: boolean;
	},
): Promise<void> {
	const m = MSG[detectLocale()];

	if (action === "serve") {
		if (!options.adminKey) {
			console.error(m.noAdminKey);
			process.exit(1);
		}
		const port = options.port ? Number.parseInt(options.port, 10) : 19290;
		const teamServer = createTeamServer({ admin_key: options.adminKey });
		await teamServer.start(port);
		console.log(chalk.green(m.serverStarted(port)));
		console.log(chalk.dim(m.stop));
		const shutdown = () => {
			teamServer
				.stop()
				.then(() => process.exit(0))
				.catch(() => process.exit(1));
		};
		process.on("SIGINT", shutdown);
		process.on("SIGTERM", shutdown);
		return;
	}

	const store = new MemberStore();

	if (action === "add") {
		if (!target) {
			console.error("Usage: claw-guard team add <email> [--role admin|member|readonly]");
			process.exit(1);
		}
		const role = (options.role ?? "member") as "admin" | "member" | "readonly";
		const result = store.addMember(target, role);
		console.log(chalk.green(m.memberAdded));
		console.log(`  Email: ${target}`);
		console.log(`  Role:  ${role}`);
		console.log(`  ID:    ${result.member.id}`);
		console.log(chalk.yellow(`  ${m.apiKeyOnce} ${result.api_key}`));
		store.close();
		return;
	}

	if (action === "list") {
		const members = store.listMembers();
		if (members.length === 0) {
			console.log(m.noMembers);
		} else {
			console.log(chalk.bold(`Members (${members.length}):`));
			for (const member of members) {
				const role = member.role === "admin" ? chalk.magenta(member.role) : chalk.blue(member.role);
				console.log(`  ${member.id}  ${member.email}  ${role}  ${member.last_seen ?? "—"}`);
			}
		}
		store.close();
		return;
	}

	if (action === "remove") {
		if (!target) {
			console.error("Usage: claw-guard team remove <member-id>");
			process.exit(1);
		}
		const removed = store.removeMember(target);
		if (removed) {
			console.log(chalk.green(m.memberRemoved));
		} else {
			console.error(m.memberNotFound);
		}
		store.close();
		return;
	}

	if (action === "policy") {
		console.log(chalk.green(m.policyUpdated));
		if (options.profile) console.log(`  Profile: ${options.profile}`);
		if (options.enforce !== undefined) console.log(`  Enforce: ${options.enforce}`);
		store.close();
		return;
	}

	console.error(m.unknownAction(action));
	store.close();
	process.exit(1);
}
