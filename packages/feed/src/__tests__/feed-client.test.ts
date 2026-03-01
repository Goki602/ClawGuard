import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FeedBundle, FeedManifest, ReputationData, Rule } from "@clawguard/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FeedCache } from "../feed-cache.js";
import { FeedClient } from "../feed-client.js";

function sha256(text: string): string {
	return createHash("sha256").update(text).digest("hex");
}

function makeFeedBundle(): FeedBundle {
	const rules: Rule[] = [
		{
			id: "TEST.RULE",
			match: { tool: "bash", command_regex: "test" },
			risk: "low",
			explain: { title: "Test", what: "test", why: ["test"], check: ["test"] },
		},
	];
	const reputation: ReputationData = { version: "1.0", entries: [] };
	const rulesJson = JSON.stringify(rules);
	const repJson = JSON.stringify(reputation);

	const manifest: FeedManifest = {
		version: "2026-03-01",
		published_at: new Date().toISOString(),
		rules_sha256: sha256(rulesJson),
		reputation_sha256: sha256(repJson),
		signature_url: "https://example.com/sig",
	};

	return { manifest, rules, reputation };
}

describe("FeedCache", () => {
	let tmpDir: string;
	let cache: FeedCache;

	beforeEach(() => {
		tmpDir = mkdtempSync(join(tmpdir(), "cg-feed-"));
		cache = new FeedCache(tmpDir);
	});

	afterEach(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	it("write and read cycle", () => {
		const bundle = makeFeedBundle();
		cache.write(bundle);
		const read = cache.read();
		expect(read).not.toBeNull();
		expect(read?.manifest.version).toBe("2026-03-01");
		expect(read?.rules).toHaveLength(1);
		expect(read?.rules[0].id).toBe("TEST.RULE");
	});

	it("returns null when no cache", () => {
		const emptyCache = new FeedCache(join(tmpDir, "empty"));
		expect(emptyCache.read()).toBeNull();
	});

	it("getLastUpdated returns date from manifest", () => {
		const bundle = makeFeedBundle();
		cache.write(bundle);
		const date = cache.getLastUpdated();
		expect(date).toBeInstanceOf(Date);
		expect(date?.getTime()).toBeGreaterThan(0);
	});

	it("getLastUpdated returns null when no cache", () => {
		expect(cache.getLastUpdated()).toBeNull();
	});
});

describe("FeedClient", () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = mkdtempSync(join(tmpdir(), "cg-feedclient-"));
	});

	afterEach(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	it("getCached returns null without cache", () => {
		const client = new FeedClient({ cacheDir: tmpDir });
		expect(client.getCached()).toBeNull();
	});

	it("getFeedAge returns max when no cache", () => {
		const client = new FeedClient({ cacheDir: tmpDir });
		expect(client.getFeedAge()).toBe(Number.MAX_SAFE_INTEGER);
	});

	it("reports stale and degraded correctly", () => {
		const client = new FeedClient({ cacheDir: tmpDir });
		expect(client.isStale()).toBe(true);
		expect(client.isDegraded()).toBe(true);
	});

	it("getStatus returns none without cache", () => {
		const client = new FeedClient({ cacheDir: tmpDir });
		const status = client.getStatus();
		expect(status.status).toBe("none");
		expect(status.version).toBeNull();
	});

	it("getStatus returns fresh with recent cache", () => {
		const cache = new FeedCache(tmpDir);
		cache.write(makeFeedBundle());
		const client = new FeedClient({ cacheDir: tmpDir });
		const status = client.getStatus();
		expect(status.status).toBe("fresh");
		expect(status.version).toBe("2026-03-01");
		expect(status.age).toBe(0);
	});
});
