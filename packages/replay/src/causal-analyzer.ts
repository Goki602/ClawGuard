import type { CausalLink, ReplayEvent } from "@clawguard/core";

const MAX_GAP_MS = 300_000; // 5 minutes

interface CausalPattern {
	name: string;
	match: (from: ReplayEvent, to: ReplayEvent) => string | null;
}

const PATTERNS: CausalPattern[] = [
	{
		name: "npm_install_then_script",
		match: (from, to) => {
			if (from.tool === "bash" && /npm\s+install/.test(from.content) && to.tool === "bash") {
				return "npm install may trigger postinstall scripts";
			}
			return null;
		},
	},
	{
		name: "file_write_then_exec",
		match: (from, to) => {
			if (from.tool === "file_write" && to.tool === "bash") {
				const written = from.content.split("\n")[0]?.trim() ?? "";
				if (written && to.content.includes(written)) {
					return `Wrote file then executed it: ${written}`;
				}
			}
			return null;
		},
	},
	{
		name: "curl_then_bash",
		match: (from, to) => {
			if (from.tool === "bash" && /curl|wget/.test(from.content) && to.tool === "bash") {
				if (/\|\s*(bash|sh|zsh)/.test(from.content)) {
					return "Downloaded and piped to shell in single command";
				}
				return "Downloaded content then executed command";
			}
			return null;
		},
	},
	{
		name: "confirm_then_followup",
		match: (from, _to) => {
			if (from.action === "confirm" && from.user_response === "allow") {
				return "User confirmed risky action, followed by related operation";
			}
			return null;
		},
	},
];

export class CausalAnalyzer {
	analyze(events: ReplayEvent[]): CausalLink[] {
		const links: CausalLink[] = [];

		for (let i = 0; i < events.length; i++) {
			for (let j = i + 1; j < events.length; j++) {
				const from = events[i];
				const to = events[j];

				const gap = new Date(to.time).getTime() - new Date(from.time).getTime();
				if (gap > MAX_GAP_MS) break;

				for (const pattern of PATTERNS) {
					const reason = pattern.match(from, to);
					if (reason) {
						links.push({ from_index: i, to_index: j, reason });
						break;
					}
				}
			}
		}

		return links;
	}

	formatChain(events: ReplayEvent[], links: CausalLink[]): string {
		if (links.length === 0) return "No causal chains detected.";

		const lines: string[] = ["=== Causal Chains ===", ""];
		for (const link of links) {
			const from = events[link.from_index];
			const to = events[link.to_index];
			lines.push(`[${link.from_index}] ${from.tool}: ${from.content.slice(0, 60)}`);
			lines.push(`  \u2514\u2500\u2192 [${link.to_index}] ${to.tool}: ${to.content.slice(0, 60)}`);
			lines.push(`  Reason: ${link.reason}`);
			lines.push("");
		}

		return lines.join("\n");
	}
}
