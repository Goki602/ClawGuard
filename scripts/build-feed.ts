#!/usr/bin/env npx tsx
/**
 * Build feed artifacts (manifest.json, rules.json, reputation.json)
 * for publishing to GitHub Releases.
 *
 * Usage: npx tsx scripts/build-feed.ts [--output-dir dist/feed]
 */

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse } from "yaml";

interface Rule {
	id: string;
	match: { tool: string; command_regex?: string; trigger?: string };
	risk: string;
	explain: {
		title: string;
		what: string;
		why: string[];
		check: string[];
		alternatives?: string[];
	};
	meta?: {
		author: string;
		pack: string;
		version: string;
		tags: string[];
		phase: number;
		marketplace?: {
			status: string;
			downloads: number;
			rating: number;
			override_rate: number;
		};
	};
}

interface FeedManifest {
	version: string;
	published_at: string;
	rules_sha256: string;
	reputation_sha256: string;
	signature_url: string;
}

interface ReputationData {
	version: string;
	entries: Array<{
		rule_id: string;
		community_total: number;
		community_allowed: number;
		community_denied: number;
		community_override_rate: number;
		last_updated: string;
	}>;
}

function loadRulesFromDir(dirPath: string): Rule[] {
	let entries: string[];
	try {
		entries = readdirSync(dirPath);
	} catch {
		return [];
	}

	const rules: Rule[] = [];
	for (const entry of entries) {
		if (!entry.endsWith(".yaml") && !entry.endsWith(".yml")) continue;
		const content = readFileSync(join(dirPath, entry), "utf-8");
		const parsed = parse(content);
		if (!parsed) continue;
		const items: Rule[] = Array.isArray(parsed) ? parsed : (parsed.rules ?? [parsed]);
		rules.push(...items);
	}
	return rules;
}

function sha256(data: string): string {
	return createHash("sha256").update(data).digest("hex");
}

function main() {
	const args = process.argv.slice(2);
	const outputDirIdx = args.indexOf("--output-dir");
	const outputDir = outputDirIdx >= 0 ? args[outputDirIdx + 1] : "dist/feed";

	const projectRoot = resolve(import.meta.dirname ?? __dirname, "..");
	const coreDir = join(projectRoot, "rules", "core");
	const phase2Dir = join(projectRoot, "rules", "phase2");

	const coreRules = loadRulesFromDir(coreDir);
	const phase2Rules = loadRulesFromDir(phase2Dir);
	const allRules = [...coreRules, ...phase2Rules];

	console.log(
		`Loaded ${coreRules.length} core + ${phase2Rules.length} phase2 = ${allRules.length} rules`,
	);

	const rulesJson = JSON.stringify(allRules, null, 2);

	const now = new Date().toISOString();
	const today = now.slice(0, 10).replace(/-/g, ".");

	const reputation: ReputationData = {
		version: today,
		entries: [],
	};
	const reputationJson = JSON.stringify(reputation, null, 2);

	const manifest: FeedManifest = {
		version: today,
		published_at: now,
		rules_sha256: sha256(rulesJson),
		reputation_sha256: sha256(reputationJson),
		signature_url: "manifest.json.sig",
	};
	const manifestJson = JSON.stringify(manifest, null, 2);

	const absOutputDir = resolve(projectRoot, outputDir);
	mkdirSync(absOutputDir, { recursive: true });

	writeFileSync(join(absOutputDir, "rules.json"), rulesJson);
	writeFileSync(join(absOutputDir, "reputation.json"), reputationJson);
	writeFileSync(join(absOutputDir, "manifest.json"), manifestJson);

	console.log(`Feed artifacts written to ${absOutputDir}/`);
	console.log(`  manifest.json (version: ${manifest.version})`);
	console.log(
		`  rules.json    (${allRules.length} rules, sha256: ${manifest.rules_sha256.slice(0, 16)}...)`,
	);
	console.log(`  reputation.json (sha256: ${manifest.reputation_sha256.slice(0, 16)}...)`);
}

main();
