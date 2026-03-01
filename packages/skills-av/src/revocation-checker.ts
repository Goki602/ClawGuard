import type {
	RevocationEntry,
	RevocationList,
	SkillManifest,
	SkillScanResult,
} from "@clawguard/core";

export class RevocationChecker {
	private revocations: RevocationList;

	constructor(revocations?: RevocationList) {
		this.revocations = revocations ?? { version: "0", entries: [] };
	}

	updateRevocations(revocations: RevocationList): void {
		this.revocations = revocations;
	}

	isRevoked(hash: string): RevocationEntry | null {
		return this.revocations.entries.find((e) => e.hash === hash) ?? null;
	}

	checkManifest(manifest: SkillManifest): SkillScanResult[] {
		return manifest.skills.map((skill) => {
			const revoked = this.isRevoked(skill.hash);
			if (revoked) {
				return {
					name: skill.name,
					path: skill.path,
					status: "revoked" as const,
					findings: [
						{
							type: "revoked_hash" as const,
							severity: "high" as const,
							detail: `Skill hash revoked: ${revoked.reason} (revoked at ${revoked.revoked_at})`,
						},
					],
				};
			}
			return { name: skill.name, path: skill.path, status: "clean" as const, findings: [] };
		});
	}
}
