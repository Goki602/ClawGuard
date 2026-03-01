import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { compileRule, loadRulesFromDir, loadRulesFromYaml } from "../rule-loader.js";
import type { Rule } from "../types.js";

describe("loadRulesFromYaml", () => {
	it("parses a single rule YAML", () => {
		const yaml = `
- id: TEST.RULE
  match:
    tool: bash
    command_regex: 'echo hello'
  risk: low
  explain:
    title: "テスト"
    what: "テスト説明"
    why: ["理由1"]
    check: ["確認1"]
`;
		const rules = loadRulesFromYaml(yaml);
		expect(rules.length).toBe(1);
		expect(rules[0].id).toBe("TEST.RULE");
		expect(rules[0].compiledRegex).toBeInstanceOf(RegExp);
	});

	it("handles empty YAML", () => {
		expect(loadRulesFromYaml("")).toEqual([]);
	});

	it("handles YAML with rules wrapper", () => {
		const yaml = `
rules:
  - id: TEST.WRAPPED
    match:
      tool: bash
      command_regex: 'test'
    risk: medium
    explain:
      title: "T"
      what: "W"
      why: ["Y"]
      check: ["C"]
`;
		const rules = loadRulesFromYaml(yaml);
		expect(rules.length).toBe(1);
		expect(rules[0].id).toBe("TEST.WRAPPED");
	});
});

describe("compileRule", () => {
	it("compiles command_regex to RegExp", () => {
		const rule: Rule = {
			id: "T.R",
			match: { tool: "bash", command_regex: "rm\\s+-rf" },
			risk: "high",
			explain: { title: "T", what: "W", why: [], check: [] },
		};
		const compiled = compileRule(rule);
		expect(compiled.compiledRegex).toBeInstanceOf(RegExp);
		expect(compiled.compiledRegex?.test("rm -rf /")).toBe(true);
		expect(compiled.compiledRegex?.test("ls -la")).toBe(false);
	});

	it("handles trigger-based rules (no regex)", () => {
		const rule: Rule = {
			id: "SKILL.NEW",
			match: { tool: "skill_install", trigger: "new_skill" },
			risk: "medium",
			explain: { title: "T", what: "W", why: [], check: [] },
		};
		const compiled = compileRule(rule);
		expect(compiled.compiledRegex).toBeUndefined();
	});
});

describe("loadRulesFromDir", () => {
	it("loads all 12 core rules", () => {
		const dir = resolve(import.meta.dirname, "../../../../rules/core");
		const rules = loadRulesFromDir(dir);
		expect(rules.length).toBe(12);
		const ids = rules.map((r) => r.id).sort();
		expect(ids).toEqual([
			"BASH.CHMOD_777",
			"BASH.ENV_FILE_READ",
			"BASH.GIT_CLEAN_FDX",
			"BASH.GIT_PUSH_FORCE",
			"BASH.GIT_RESET_HARD",
			"BASH.NPM_INSTALL",
			"BASH.PIPE_EXEC_001",
			"BASH.PIPE_EXEC_002",
			"BASH.PIP_INSTALL",
			"BASH.RM_RISK",
			"BASH.ROOT_PATH_OP",
			"BASH.SSH_KEY_READ",
		]);
	});

	it("returns empty for non-existent directory", () => {
		const rules = loadRulesFromDir("/nonexistent/path");
		expect(rules).toEqual([]);
	});

	it("all rules have compiledRegex", () => {
		const dir = resolve(import.meta.dirname, "../../../../rules/core");
		const rules = loadRulesFromDir(dir);
		for (const rule of rules) {
			expect(rule.compiledRegex).toBeInstanceOf(RegExp);
		}
	});
});
