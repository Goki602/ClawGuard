import { existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PolicyDecision, ToolRequest } from "@clawguard/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createOcsfEvent } from "../ocsf-logger.js";
import { AuditReader } from "../reader.js";
import { AuditWriter } from "../writer.js";

function makeEvent() {
	const request: ToolRequest = {
		tool: "bash",
		content: "rm -rf /tmp/test",
		context: { agent: "test", working_dir: "/tmp", session_id: "s1" },
	};
	const decision: PolicyDecision = {
		action: "confirm",
		risk: "high",
		rule_id: "BASH.RM_RISK",
		feed_version: "0.1.0",
	};
	return createOcsfEvent(request, decision);
}

describe("AuditWriter", () => {
	const tmpDir = join(tmpdir(), `clawguard-test-audit-${Date.now()}`);

	beforeEach(() => mkdirSync(tmpDir, { recursive: true }));
	afterEach(() => rmSync(tmpDir, { recursive: true, force: true }));

	it("creates log directory if not exists", () => {
		const logDir = join(tmpDir, "logs");
		const writer = new AuditWriter(logDir);
		expect(existsSync(logDir)).toBe(true);
		expect(writer.getLogPath()).toBe(logDir);
	});

	it("writes JSONL log entries", () => {
		const writer = new AuditWriter(tmpDir);
		writer.write(makeEvent());
		writer.write(makeEvent());

		const reader = new AuditReader(tmpDir);
		const dates = reader.listDates();
		expect(dates.length).toBe(1);

		const events = reader.readDate(dates[0]);
		expect(events.length).toBe(2);
		expect(events[0].class_uid).toBe(6003);
	});

	it("pruneOlderThan removes old files", () => {
		const writer = new AuditWriter(tmpDir);
		writer.write(makeEvent());

		// Prune with 0 days = remove everything before now
		// Since the file was just created, it should NOT be removed with days=1
		const removed1 = writer.pruneOlderThan(1);
		expect(removed1).toBe(0);
	});
});

describe("AuditReader", () => {
	const tmpDir = join(tmpdir(), `clawguard-test-reader-${Date.now()}`);

	beforeEach(() => mkdirSync(tmpDir, { recursive: true }));
	afterEach(() => rmSync(tmpDir, { recursive: true, force: true }));

	it("returns empty array for no logs", () => {
		const reader = new AuditReader(tmpDir);
		expect(reader.listDates()).toEqual([]);
		expect(reader.readDate("2026-01-01")).toEqual([]);
	});

	it("lists available dates", () => {
		const writer = new AuditWriter(tmpDir);
		writer.write(makeEvent());
		const reader = new AuditReader(tmpDir);
		const dates = reader.listDates();
		expect(dates.length).toBeGreaterThan(0);
		expect(dates[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});
