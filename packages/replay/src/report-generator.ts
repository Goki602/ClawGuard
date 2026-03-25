import type { AuditReader, OcsfEvent } from "@clawguard/audit";
import type { Action, PublicSecurityReport, WeeklyReportData } from "@clawguard/core";
import type { FalsePositiveMonitor } from "@clawguard/memory";

export class ReportGenerator {
	private reader: AuditReader;

	constructor(
		reader: AuditReader,
		private monitor?: FalsePositiveMonitor,
		private ruleCount?: number,
	) {
		this.reader = reader;
	}

	generateWeekly(weekOffset = 0): WeeklyReportData {
		const { start, end } = this.getWeekRange(weekOffset);
		const { start: prevStart, end: prevEnd } = this.getWeekRange(weekOffset - 1);

		const dates = this.reader.listDates();
		const currentDates = dates.filter((d) => d >= start && d <= end);
		const prevDates = dates.filter((d) => d >= prevStart && d <= prevEnd);

		const currentEvents: OcsfEvent[] = [];
		for (const d of currentDates) {
			currentEvents.push(...this.reader.readDate(d));
		}

		const prevEvents: OcsfEvent[] = [];
		for (const d of prevDates) {
			prevEvents.push(...this.reader.readDate(d));
		}

		const breakdown = this.countActions(currentEvents);
		const prevBreakdown = this.countActions(prevEvents);
		const incidents = currentEvents.filter(
			(e) => e.disposition_id === 5 && e.severity_id === 4,
		).length;
		const denyCount = breakdown.denied;
		const confirmCount = breakdown.confirmed;
		let safetyScore = 100 - denyCount * 10 - confirmCount * 2;
		if (incidents === 0 && currentEvents.length > 0) safetyScore += 5;
		safetyScore = Math.max(0, Math.min(100, safetyScore));

		const sessions = new Set(currentEvents.map((e) => e.actor.session.uid)).size;

		return {
			period: { start, end },
			total_decisions: currentEvents.length,
			decision_breakdown: breakdown,
			top_rules: this.getTopRules(currentEvents),
			agents: this.getAgents(currentEvents),
			sessions,
			safety_score: safetyScore,
			trends: {
				vs_previous_week: {
					total_diff: currentEvents.length - prevEvents.length,
					deny_diff: breakdown.denied - prevBreakdown.denied,
				},
			},
			incidents,
		};
	}

	renderMarkdown(data: WeeklyReportData): string {
		const lines: string[] = [
			"# ClawGuard Weekly Report",
			"",
			`**Period**: ${data.period.start} \u2014 ${data.period.end}`,
			"",
			`## Safety Score: ${data.safety_score}/100`,
			"",
			"## Decision Summary",
			"",
			"| Metric | Count |",
			"|--------|-------|",
			`| Total | ${data.total_decisions} |`,
			`| Allowed | ${data.decision_breakdown.allowed} |`,
			`| Confirmed | ${data.decision_breakdown.confirmed} |`,
			`| Denied | ${data.decision_breakdown.denied} |`,
			`| Incidents | ${data.incidents} |`,
			`| Sessions | ${data.sessions} |`,
			"",
			"## Top Rules",
			"",
			"| Rule | Count |",
			"|------|-------|",
		];

		for (const rule of data.top_rules.slice(0, 10)) {
			lines.push(`| ${rule.rule_id} | ${rule.count} |`);
		}

		lines.push("");
		lines.push("## Agents");
		lines.push("");
		lines.push("| Agent | Decisions |");
		lines.push("|-------|-----------|");
		for (const agent of data.agents) {
			lines.push(`| ${agent.name} | ${agent.decision_count} |`);
		}

		lines.push("");
		lines.push("## Trends vs Previous Week");
		lines.push("");
		const totalArrow = data.trends.vs_previous_week.total_diff >= 0 ? "\u2191" : "\u2193";
		const denyArrow = data.trends.vs_previous_week.deny_diff >= 0 ? "\u2191" : "\u2193";
		lines.push(
			`- Total decisions: ${totalArrow} ${Math.abs(data.trends.vs_previous_week.total_diff)}`,
		);
		lines.push(`- Denied: ${denyArrow} ${Math.abs(data.trends.vs_previous_week.deny_diff)}`);
		lines.push("");

		return lines.join("\n");
	}

	generatePublic(weekOffset = 0): PublicSecurityReport {
		const weekly = this.generateWeekly(weekOffset);
		const alerts = this.monitor?.analyze() ?? [];

		const needsTuning = alerts.filter(
			(a) => a.severity === "warning" || a.severity === "critical",
		).length;
		const healthy = (this.ruleCount ?? 0) - needsTuning;

		const highlights: string[] = [];
		if (weekly.total_decisions > 0) {
			highlights.push(`${weekly.total_decisions} decisions evaluated this week`);
		}
		if (weekly.incidents > 0) {
			highlights.push(`${weekly.incidents} high-risk operations blocked`);
		}
		if (needsTuning > 0) {
			highlights.push(`${needsTuning} rules flagged for tuning based on override rates`);
		}
		if (weekly.safety_score >= 90) {
			highlights.push(`Safety score: ${weekly.safety_score}/100 — excellent`);
		}

		const topBlocked = weekly.top_rules
			.filter((r) => r.action_distribution.deny > 0 || r.action_distribution.confirm > 0)
			.slice(0, 5)
			.map((r) => ({
				rule_id: r.rule_id,
				count: r.action_distribution.deny + r.action_distribution.confirm,
				risk: r.action_distribution.deny > 0 ? "high" : "medium",
			}));

		return {
			generated_at: new Date().toISOString(),
			period: weekly.period,
			highlights,
			community_stats: {
				total_decisions: weekly.total_decisions,
				total_rules_active: this.ruleCount ?? 0,
				agents_supported: weekly.agents.map((a) => a.name),
			},
			rule_health: {
				total_rules: this.ruleCount ?? 0,
				healthy: Math.max(0, healthy),
				needs_tuning: needsTuning,
				deprecated_this_period: 0,
				promoted_this_period: 0,
			},
			top_blocked: topBlocked,
			feed_updates: {
				rules_added: 0,
				rules_updated: 0,
			},
		};
	}

	renderPublicMarkdown(data: PublicSecurityReport): string {
		const lines: string[] = [
			"# ClawGuard Public Security Report",
			"",
			`**Period**: ${data.period.start} \u2014 ${data.period.end}`,
			`**Generated**: ${data.generated_at.split("T")[0]}`,
			"",
		];

		if (data.highlights.length > 0) {
			lines.push("## Highlights", "");
			for (const h of data.highlights) {
				lines.push(`- ${h}`);
			}
			lines.push("");
		}

		lines.push("## Community Stats", "");
		lines.push("| Metric | Value |");
		lines.push("|--------|-------|");
		lines.push(`| Total Decisions | ${data.community_stats.total_decisions} |`);
		lines.push(`| Active Rules | ${data.community_stats.total_rules_active} |`);
		lines.push(`| Agents | ${data.community_stats.agents_supported.join(", ") || "\u2014"} |`);
		lines.push("");

		lines.push("## Rule Health", "");
		lines.push("| Status | Count |");
		lines.push("|--------|-------|");
		lines.push(`| Healthy | ${data.rule_health.healthy} |`);
		lines.push(`| Needs Tuning | ${data.rule_health.needs_tuning} |`);
		lines.push(`| Promoted | ${data.rule_health.promoted_this_period} |`);
		lines.push(`| Deprecated | ${data.rule_health.deprecated_this_period} |`);
		lines.push("");

		if (data.top_blocked.length > 0) {
			lines.push("## Top Blocked Operations", "");
			lines.push("| Rule | Count | Risk |");
			lines.push("|------|-------|------|");
			for (const b of data.top_blocked) {
				lines.push(`| ${b.rule_id} | ${b.count} | ${b.risk} |`);
			}
			lines.push("");
		}

		lines.push("---");
		lines.push("*Generated by [ClawGuard](https://clawguard-sec.com) \u2014 AI agent memory*");
		lines.push("");

		return lines.join("\n");
	}

	private getWeekRange(offset: number): { start: string; end: string } {
		const now = new Date();
		const dayOfWeek = now.getDay();
		const monday = new Date(now);
		monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7) + offset * 7);
		monday.setHours(0, 0, 0, 0);
		const sunday = new Date(monday);
		sunday.setDate(monday.getDate() + 6);

		return {
			start: this.formatDate(monday),
			end: this.formatDate(sunday),
		};
	}

	private formatDate(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		return `${y}-${m}-${day}`;
	}

	private countActions(events: OcsfEvent[]): {
		allowed: number;
		confirmed: number;
		denied: number;
	} {
		let allowed = 0;
		let confirmed = 0;
		let denied = 0;
		for (const e of events) {
			const action = e.enrichments.find((en) => en.name === "action")?.value ?? "allow";
			if (action === "allow" || action === "log") allowed++;
			else if (action === "confirm") confirmed++;
			else if (action === "deny") denied++;
		}
		return { allowed, confirmed, denied };
	}

	private getTopRules(events: OcsfEvent[]): Array<{
		rule_id: string;
		count: number;
		action_distribution: Record<Action, number>;
	}> {
		const ruleMap = new Map<string, { count: number; dist: Record<Action, number> }>();
		for (const e of events) {
			const ruleId = e.enrichments.find((en) => en.name === "rule_id")?.value ?? "unknown";
			const action = (e.enrichments.find((en) => en.name === "action")?.value ?? "allow") as Action;
			if (!ruleMap.has(ruleId)) {
				ruleMap.set(ruleId, {
					count: 0,
					dist: { allow: 0, confirm: 0, deny: 0, log: 0 },
				});
			}
			const entry = ruleMap.get(ruleId);
			if (!entry) continue;
			entry.count++;
			entry.dist[action]++;
		}
		return Array.from(ruleMap.entries())
			.map(([rule_id, data]) => ({
				rule_id,
				count: data.count,
				action_distribution: data.dist,
			}))
			.sort((a, b) => b.count - a.count);
	}

	private getAgents(events: OcsfEvent[]): Array<{ name: string; decision_count: number }> {
		const agentMap = new Map<string, number>();
		for (const e of events) {
			const name = e.actor.app_name;
			agentMap.set(name, (agentMap.get(name) ?? 0) + 1);
		}
		return Array.from(agentMap.entries())
			.map(([name, decision_count]) => ({ name, decision_count }))
			.sort((a, b) => b.decision_count - a.decision_count);
	}
}
