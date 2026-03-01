import { TtlCache } from "./cache.js";

export interface NpmPackageInfo {
	name: string;
	downloads_last_week: number;
	has_postinstall: boolean;
	deprecated: boolean;
	latest_version: string;
}

const cache = new TtlCache<NpmPackageInfo>(300);

export async function lookupNpmPackage(name: string): Promise<NpmPackageInfo | null> {
	const cached = cache.get(name);
	if (cached) return cached;

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 3000);

		const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
			signal: controller.signal,
		});
		clearTimeout(timeout);

		if (!res.ok) return null;

		const data = (await res.json()) as Record<string, unknown>;
		const distTags = data["dist-tags"] as Record<string, string> | undefined;
		const latestVersion = distTags?.latest ?? "unknown";
		const versions = data.versions as Record<string, Record<string, unknown>> | undefined;
		const latestMeta = versions?.[latestVersion];
		const scripts = latestMeta?.scripts as Record<string, string> | undefined;
		const hasPostinstall = Boolean(scripts?.postinstall || scripts?.preinstall);
		const deprecated = typeof latestMeta?.deprecated === "string";

		let downloads = 0;
		try {
			const dlController = new AbortController();
			const dlTimeout = setTimeout(() => dlController.abort(), 3000);
			const dlRes = await fetch(
				`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(name)}`,
				{ signal: dlController.signal },
			);
			clearTimeout(dlTimeout);
			if (dlRes.ok) {
				const dlData = (await dlRes.json()) as { downloads?: number };
				downloads = dlData.downloads ?? 0;
			}
		} catch {
			// Download count is best-effort
		}

		const info: NpmPackageInfo = {
			name,
			downloads_last_week: downloads,
			has_postinstall: hasPostinstall,
			deprecated,
			latest_version: latestVersion,
		};

		cache.set(name, info);
		return info;
	} catch {
		return null;
	}
}

export function extractPackageName(command: string): string | null {
	const npmMatch = command.match(/npm\s+(?:install|i|add)\s+(?!-)\s*([^\s]+)/);
	if (npmMatch) {
		const raw = npmMatch[1];
		return raw.replace(/@[\^~]?[\d.]+.*$/, "");
	}
	return null;
}
