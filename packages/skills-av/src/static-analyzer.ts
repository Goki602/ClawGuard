import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { RiskLevel, SkillScanResult } from "@clawguard/core";

interface StaticPattern {
	id: string;
	pattern: RegExp;
	severity: RiskLevel;
	detail: string;
}

const PATTERNS: StaticPattern[] = [
	{
		id: "SA.PIPE_EXEC",
		pattern: /curl\s[^|]*\|\s*(bash|sh)\b|wget\s[^|]*\|\s*(bash|sh)\b/i,
		severity: "high",
		detail: "External script pipe execution detected",
	},
	{
		id: "SA.ENV_EXFIL",
		pattern:
			/\$(?:HOME|SSH_AUTH_SOCK|AWS_SECRET|GITHUB_TOKEN|API_KEY)[\s\S]*?(?:curl|wget|fetch|http)/is,
		severity: "high",
		detail: "Potential environment variable exfiltration",
	},
	{
		id: "SA.EXCESSIVE_FILE_OPS",
		pattern: /rm\s+-rf\b|find\s[^;]*-delete\b|truncate\s/i,
		severity: "medium",
		detail: "Excessive file operation patterns",
	},
	{
		id: "SA.COPYPASTE_PROMPT",
		pattern: /copy.{0,30}paste|run.{0,30}(?:in\s+)?(?:your\s+)?terminal/i,
		severity: "medium",
		detail: "Copy-paste prompt injection pattern",
	},
];

export class StaticAnalyzer {
	analyzeContent(content: string, filename: string): SkillScanResult["findings"] {
		const findings: SkillScanResult["findings"] = [];
		for (const p of PATTERNS) {
			if (p.pattern.test(content)) {
				findings.push({
					type: "static_pattern",
					severity: p.severity,
					detail: `[${p.id}] ${p.detail} in ${filename}`,
				});
			}
		}
		return findings;
	}

	analyzeDir(skillPath: string): SkillScanResult["findings"] {
		const findings: SkillScanResult["findings"] = [];
		try {
			const files = readdirSync(skillPath, { withFileTypes: true })
				.filter((d) => d.isFile())
				.map((d) => d.name);
			for (const file of files) {
				const content = readFileSync(join(skillPath, file), "utf-8");
				findings.push(...this.analyzeContent(content, file));
			}
		} catch {
			findings.push({
				type: "static_pattern",
				severity: "medium",
				detail: `Failed to read skill directory: ${skillPath}`,
			});
		}
		return findings;
	}
}
