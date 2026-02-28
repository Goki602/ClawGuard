import { describe, expect, it } from "vitest";
import { PRESETS, getPreset, isValidPresetName, resolveAction } from "../preset-system.js";
import type { PresetName, RiskLevel } from "../types.js";

describe("getPreset", () => {
	it("returns all 4 presets", () => {
		const names: PresetName[] = ["observer", "guardian", "balanced", "expert"];
		for (const name of names) {
			const preset = getPreset(name);
			expect(preset.name).toBe(name);
			expect(preset.mapping).toBeDefined();
		}
	});

	it("throws for unknown preset", () => {
		expect(() => getPreset("nonexistent" as PresetName)).toThrow("Unknown preset");
	});
});

describe("resolveAction", () => {
	const risks: RiskLevel[] = ["low", "medium", "high"];

	it("observer: all risks → log", () => {
		const preset = getPreset("observer");
		for (const risk of risks) {
			expect(resolveAction(preset, risk)).toBe("log");
		}
	});

	it("guardian: low=allow, medium=confirm, high=deny", () => {
		const preset = getPreset("guardian");
		expect(resolveAction(preset, "low")).toBe("allow");
		expect(resolveAction(preset, "medium")).toBe("confirm");
		expect(resolveAction(preset, "high")).toBe("deny");
	});

	it("balanced: low=allow, medium=confirm, high=confirm", () => {
		const preset = getPreset("balanced");
		expect(resolveAction(preset, "low")).toBe("allow");
		expect(resolveAction(preset, "medium")).toBe("confirm");
		expect(resolveAction(preset, "high")).toBe("confirm");
	});

	it("expert: low=allow, medium=allow, high=confirm", () => {
		const preset = getPreset("expert");
		expect(resolveAction(preset, "low")).toBe("allow");
		expect(resolveAction(preset, "medium")).toBe("allow");
		expect(resolveAction(preset, "high")).toBe("confirm");
	});
});

describe("isValidPresetName", () => {
	it("valid names", () => {
		expect(isValidPresetName("observer")).toBe(true);
		expect(isValidPresetName("guardian")).toBe(true);
		expect(isValidPresetName("balanced")).toBe(true);
		expect(isValidPresetName("expert")).toBe(true);
	});

	it("invalid names", () => {
		expect(isValidPresetName("invalid")).toBe(false);
		expect(isValidPresetName("")).toBe(false);
		expect(isValidPresetName("BALANCED")).toBe(false);
	});
});

describe("PRESETS completeness", () => {
	it("every preset has all 3 risk levels mapped", () => {
		for (const [, preset] of Object.entries(PRESETS)) {
			expect(preset.mapping.low).toBeDefined();
			expect(preset.mapping.medium).toBeDefined();
			expect(preset.mapping.high).toBeDefined();
		}
	});
});
