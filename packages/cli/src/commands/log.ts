import { AuditReader } from "@clawguard/audit";
import chalk from "chalk";
import { detectLocale } from "../locale.js";

const MSG = {
	ja: {
		noLogs: (dateStr: string) => `${dateStr} のログはありません`,
		availableDates: (dates: string) => `\n利用可能な日付: ${dates}`,
		header: (dateStr: string, count: number) => `\n📋 監査ログ: ${dateStr} (${count} events)\n`,
	},
	en: {
		noLogs: (dateStr: string) => `No logs for ${dateStr}`,
		availableDates: (dates: string) => `\nAvailable dates: ${dates}`,
		header: (dateStr: string, count: number) => `\n📋 Audit Log: ${dateStr} (${count} events)\n`,
	},
};

export async function logCommand(options: { today?: boolean; date?: string }): Promise<void> {
	const m = MSG[detectLocale()];
	const reader = new AuditReader();

	let dateStr: string;
	if (options.date) {
		dateStr = options.date;
	} else {
		const d = new Date();
		dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
	}

	const events = reader.readDate(dateStr);

	if (events.length === 0) {
		console.log(m.noLogs(dateStr));
		const dates = reader.listDates();
		if (dates.length > 0) {
			console.log(m.availableDates(dates.join(", ")));
		}
		return;
	}

	console.log(chalk.bold(m.header(dateStr, events.length)));

	for (const event of events) {
		const time = event.time.split("T")[1]?.split(".")[0] ?? "";
		const action = event.enrichments.find((e) => e.name === "action")?.value ?? event.disposition;
		const ruleId = event.enrichments.find((e) => e.name === "rule_id")?.value ?? "";
		const command = event.api.request.data.content;
		const shortCmd = command.length > 60 ? `${command.slice(0, 57)}...` : command;

		const actionColor =
			action === "allow" || action === "log" || action === "Allowed"
				? chalk.green
				: action === "confirm" || action === "Blocked"
					? chalk.yellow
					: chalk.red;

		console.log(
			`${chalk.dim(time)} [${actionColor(action.padEnd(7))}] ${shortCmd} ${chalk.dim(`(${ruleId})`)}`,
		);
	}
}
