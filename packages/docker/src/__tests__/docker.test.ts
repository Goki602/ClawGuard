import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const DOCKER_DIR = resolve(import.meta.dirname, "../..");

describe("Docker templates", () => {
	it("docker-compose.yml exists and has 3 services", () => {
		const content = readFileSync(resolve(DOCKER_DIR, "docker-compose.yml"), "utf-8");
		expect(content).toContain("gateway:");
		expect(content).toContain("fetcher:");
		expect(content).toContain("agent:");
	});

	it("defines internal and external networks", () => {
		const content = readFileSync(resolve(DOCKER_DIR, "docker-compose.yml"), "utf-8");
		expect(content).toContain("internal:");
		expect(content).toContain("external:");
	});

	it("all services have security hardening", () => {
		const content = readFileSync(resolve(DOCKER_DIR, "docker-compose.yml"), "utf-8");
		const services = content.split(/^ {2}\w+:/gm).slice(1);
		for (const svc of services) {
			if (svc.includes("build:") || svc.includes("image:")) {
				expect(svc).toContain("read_only: true");
				expect(svc).toContain("no-new-privileges:true");
				expect(svc).toContain("cap_drop:");
			}
		}
	});

	it("agent has no external network access", () => {
		const content = readFileSync(resolve(DOCKER_DIR, "docker-compose.yml"), "utf-8");
		const agentSection = content.split("agent:")[1]?.split(/^ {2}\w+:/m)[0] ?? "";
		expect(agentSection).toContain("internal");
		expect(agentSection).not.toContain("external");
	});

	it("gateway Dockerfile exists", () => {
		expect(existsSync(resolve(DOCKER_DIR, "gateway/Dockerfile"))).toBe(true);
	});

	it(".env.example contains required variables", () => {
		const content = readFileSync(resolve(DOCKER_DIR, ".env.example"), "utf-8");
		expect(content).toContain("CLAWGUARD_PROFILE");
		expect(content).toContain("FEED_URL");
		expect(content).toContain("AGENT_IMAGE");
	});
});
