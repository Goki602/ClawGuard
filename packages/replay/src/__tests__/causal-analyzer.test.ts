import type { ReplayEvent } from "@clawguard/core";
import { describe, expect, it } from "vitest";
import { CausalAnalyzer } from "../causal-analyzer.js";

function makeReplay(overrides: Partial<ReplayEvent> = {}): ReplayEvent {
	return {
		time: "2026-03-01T10:00:00Z",
		action: "allow",
		tool: "bash",
		content: "ls -la",
		rule_id: "BASH.LS",
		risk: "low",
		flagged: false,
		...overrides,
	};
}

describe("CausalAnalyzer", () => {
	it("detects npm install -> script execution chain", () => {
		const events = [
			makeReplay({
				time: "2026-03-01T10:00:00Z",
				content: "npm install malicious-pkg",
				tool: "bash",
			}),
			makeReplay({
				time: "2026-03-01T10:01:00Z",
				content: "node script.js",
				tool: "bash",
			}),
		];
		const analyzer = new CausalAnalyzer();
		const links = analyzer.analyze(events);
		expect(links).toHaveLength(1);
		expect(links[0].reason).toContain("postinstall");
	});

	it("detects file_write -> bash execution chain", () => {
		const events = [
			makeReplay({
				time: "2026-03-01T10:00:00Z",
				content: "malicious.sh\n#!/bin/bash\nrm -rf /",
				tool: "file_write",
			}),
			makeReplay({
				time: "2026-03-01T10:01:00Z",
				content: "bash malicious.sh",
				tool: "bash",
			}),
		];
		const analyzer = new CausalAnalyzer();
		const links = analyzer.analyze(events);
		expect(links).toHaveLength(1);
		expect(links[0].reason).toContain("malicious.sh");
	});

	it("skips links beyond 5-minute gap", () => {
		const events = [
			makeReplay({
				time: "2026-03-01T10:00:00Z",
				content: "npm install pkg",
				tool: "bash",
			}),
			makeReplay({
				time: "2026-03-01T10:10:00Z",
				content: "node script.js",
				tool: "bash",
			}),
		];
		const analyzer = new CausalAnalyzer();
		const links = analyzer.analyze(events);
		expect(links).toHaveLength(0);
	});

	it("formatChain produces human-readable output", () => {
		const events = [
			makeReplay({ content: "npm install bad-pkg" }),
			makeReplay({ content: "node exploit.js" }),
		];
		const links = [
			{
				from_index: 0,
				to_index: 1,
				reason: "npm install may trigger postinstall scripts",
			},
		];
		const analyzer = new CausalAnalyzer();
		const output = analyzer.formatChain(events, links);
		expect(output).toContain("Causal Chains");
		expect(output).toContain("npm install bad-pkg");
		expect(output).toContain("postinstall");
	});

	it("formatChain returns message when no chains detected", () => {
		const analyzer = new CausalAnalyzer();
		const output = analyzer.formatChain([], []);
		expect(output).toContain("No causal chains");
	});
});
