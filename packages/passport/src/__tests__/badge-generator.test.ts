import type { SecurityPassport } from "@clawguard/core";
import { describe, expect, it } from "vitest";
import { BadgeGenerator } from "../badge-generator.js";

function makePassport(incidents = 0): SecurityPassport {
	return {
		version: "1.0",
		repository: "test/repo",
		monitoring_since: "2026-01-01",
		last_updated: "2026-03-01T10:00:00Z",
		summary: {
			total_decisions: 100,
			allowed: 90,
			confirmed: 8,
			denied: 2,
			incidents,
		},
		agents_monitored: ["claude"],
		feed_version: "1.0.0",
	};
}

describe("BadgeGenerator", () => {
	it("generates shields.io URL with green for zero incidents", () => {
		const gen = new BadgeGenerator();
		const url = gen.generateUrl(makePassport(0));
		expect(url).toContain("shields.io");
		expect(url).toContain("brightgreen");
		expect(url).toContain("monitored");
	});

	it("generates shields.io URL with yellow for incidents", () => {
		const gen = new BadgeGenerator();
		const url = gen.generateUrl(makePassport(3));
		expect(url).toContain("yellow");
		expect(url).toContain("3%20incidents");
	});

	it("generates valid SVG", () => {
		const gen = new BadgeGenerator();
		const svg = gen.generateSvg(makePassport(0));
		expect(svg).toContain("<svg");
		expect(svg).toContain("ClawGuard");
		expect(svg).toContain("Monitored");
		expect(svg).toContain("#4ade80"); // green
	});

	it("generates SVG with yellow for incidents", () => {
		const gen = new BadgeGenerator();
		const svg = gen.generateSvg(makePassport(2));
		expect(svg).toContain("#facc15"); // yellow
		expect(svg).toContain("2 incidents");
	});

	it("generates Markdown snippet", () => {
		const gen = new BadgeGenerator();
		const md = gen.generateMarkdown(makePassport(0));
		expect(md).toContain("[![ClawGuard]");
		expect(md).toContain("shields.io");
		expect(md).toContain("since 2026-01-01");
		expect(md).toContain("100 decisions audited");
	});
});
