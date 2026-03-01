import type { AuditReader } from "@clawguard/audit";
import type { OcsfEvent } from "@clawguard/audit";
import type { Action, ReplayEvent, RiskLevel, SessionTimeline } from "@clawguard/core";

export class SessionBuilder {
	private reader: AuditReader;

	constructor(reader: AuditReader) {
		this.reader = reader;
	}

	buildForDate(dateStr: string): SessionTimeline[] {
		const events = this.reader.readDate(dateStr);
		return this.groupIntoTimelines(events);
	}

	buildForRange(startDate: string, endDate: string): SessionTimeline[] {
		const dates = this.reader.listDates().filter((d) => d >= startDate && d <= endDate);
		const allEvents: OcsfEvent[] = [];
		for (const d of dates) {
			allEvents.push(...this.reader.readDate(d));
		}
		return this.groupIntoTimelines(allEvents);
	}

	buildForSession(sessionId: string, dateStr?: string): SessionTimeline | null {
		const dates = dateStr ? [dateStr] : this.reader.listDates();
		const allEvents: OcsfEvent[] = [];
		for (const d of dates) {
			allEvents.push(...this.reader.readDate(d));
		}
		const sessionEvents = allEvents.filter((e) => e.actor.session.uid === sessionId);
		if (sessionEvents.length === 0) return null;
		const timelines = this.groupIntoTimelines(sessionEvents);
		return timelines[0] ?? null;
	}

	listSessions(dateStr: string): Array<{
		session_id: string;
		agent: string;
		event_count: number;
		start_time: string;
		end_time: string;
		has_incidents: boolean;
	}> {
		const timelines = this.buildForDate(dateStr);
		return timelines.map((t) => ({
			session_id: t.session_id,
			agent: t.agent,
			event_count: t.events.length,
			start_time: t.start_time,
			end_time: t.end_time,
			has_incidents: t.events.some((e) => e.flagged),
		}));
	}

	private groupIntoTimelines(events: OcsfEvent[]): SessionTimeline[] {
		const groups = new Map<string, OcsfEvent[]>();
		for (const event of events) {
			const sid = event.actor.session.uid;
			if (!groups.has(sid)) groups.set(sid, []);
			groups.get(sid)?.push(event);
		}

		const timelines: SessionTimeline[] = [];
		for (const [sessionId, sessionEvents] of groups) {
			sessionEvents.sort((a, b) => a.time.localeCompare(b.time));

			const replayEvents = sessionEvents.map((e) => this.toReplayEvent(e));
			const denyCount = replayEvents.filter((e) => e.action === "deny").length;
			const confirmCount = replayEvents.filter((e) => e.action === "confirm").length;
			const riskScore = Math.max(0, Math.min(100, 100 - denyCount * 15 - confirmCount * 5));

			timelines.push({
				session_id: sessionId,
				agent: sessionEvents[0].actor.app_name,
				start_time: sessionEvents[0].time,
				end_time: sessionEvents[sessionEvents.length - 1].time,
				events: replayEvents,
				causal_chains: [],
				risk_score: riskScore,
			});
		}

		return timelines.sort((a, b) => a.start_time.localeCompare(b.start_time));
	}

	private toReplayEvent(event: OcsfEvent): ReplayEvent {
		const getEnrichment = (name: string): string =>
			event.enrichments.find((e) => e.name === name)?.value ?? "";

		const action = (getEnrichment("action") || "allow") as Action;
		const risk = (getEnrichment("risk_level") || "low") as RiskLevel;

		return {
			time: event.time,
			action,
			tool: event.api.operation,
			content: event.api.request.data.content,
			rule_id: getEnrichment("rule_id"),
			risk,
			user_response: (event.unmapped as Record<string, unknown> | undefined)?.user_response as
				| string
				| undefined,
			enrichments: event.enrichments,
			flagged: action === "confirm" || action === "deny",
		};
	}
}
