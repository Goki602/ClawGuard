import { createHash } from "node:crypto";
import type { FeedBundle, FeedManifest, ReputationData, Rule } from "@clawguard/core";
import { FeedCache } from "./feed-cache.js";

const DEFAULT_FEED_URL = "https://github.com/Goki602/ClawGuard/releases/download/feed-latest";
const STALE_DAYS = 7;
const DEGRADED_DAYS = 30;

export interface FeedClientConfig {
	url?: string;
	cacheDir?: string;
}

export class FeedClient {
	private cache: FeedCache;
	private baseUrl: string;

	constructor(config?: FeedClientConfig) {
		this.baseUrl = config?.url ?? DEFAULT_FEED_URL;
		this.cache = new FeedCache(config?.cacheDir);
	}

	async fetchLatest(): Promise<FeedBundle | null> {
		try {
			const manifestText = await this.fetchText(`${this.baseUrl}/manifest.json`);
			const manifest: FeedManifest = JSON.parse(manifestText);

			const cached = this.cache.read();
			if (cached && cached.manifest.version === manifest.version) {
				return cached;
			}

			const rulesText = await this.fetchText(`${this.baseUrl}/rules.json`);
			const reputationText = await this.fetchText(`${this.baseUrl}/reputation.json`);

			if (!this.verifyHash(rulesText, manifest.rules_sha256)) {
				return this.cache.read();
			}
			if (!this.verifyHash(reputationText, manifest.reputation_sha256)) {
				return this.cache.read();
			}

			const rules: Rule[] = JSON.parse(rulesText);
			const reputation: ReputationData = JSON.parse(reputationText);
			const bundle: FeedBundle = { manifest, rules, reputation };

			this.cache.write(bundle);
			return bundle;
		} catch {
			return this.cache.read();
		}
	}

	getCached(): FeedBundle | null {
		return this.cache.read();
	}

	getFeedAge(): number {
		const lastUpdated = this.cache.getLastUpdated();
		if (!lastUpdated) return Number.MAX_SAFE_INTEGER;
		const diffMs = Date.now() - lastUpdated.getTime();
		return Math.floor(diffMs / (1000 * 60 * 60 * 24));
	}

	isStale(): boolean {
		return this.getFeedAge() > STALE_DAYS;
	}

	isDegraded(): boolean {
		return this.getFeedAge() > DEGRADED_DAYS;
	}

	getStatus(): {
		version: string | null;
		age: number;
		status: "fresh" | "stale" | "degraded" | "none";
	} {
		const cached = this.cache.read();
		const age = this.getFeedAge();
		if (!cached) return { version: null, age, status: "none" };
		const status = age > DEGRADED_DAYS ? "degraded" : age > STALE_DAYS ? "stale" : "fresh";
		return { version: cached.manifest.version, age, status };
	}

	private verifyHash(content: string, expectedHash: string): boolean {
		const actual = createHash("sha256").update(content).digest("hex");
		return actual === expectedHash;
	}

	private async fetchText(url: string): Promise<string> {
		const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return response.text();
	}
}
