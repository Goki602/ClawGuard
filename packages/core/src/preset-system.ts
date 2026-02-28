import type { Action, Preset, PresetName, RiskLevel } from "./types.js";

const PRESETS: Record<PresetName, Preset> = {
	observer: {
		name: "observer",
		mapping: { low: "log", medium: "log", high: "log" },
	},
	guardian: {
		name: "guardian",
		mapping: { low: "allow", medium: "confirm", high: "deny" },
	},
	balanced: {
		name: "balanced",
		mapping: { low: "allow", medium: "confirm", high: "confirm" },
	},
	expert: {
		name: "expert",
		mapping: { low: "allow", medium: "allow", high: "confirm" },
	},
};

const PRESET_NAMES = new Set<string>(Object.keys(PRESETS));

export function getPreset(name: PresetName): Preset {
	const preset = PRESETS[name];
	if (!preset) {
		throw new Error(`Unknown preset: ${name}. Valid: ${[...PRESET_NAMES].join(", ")}`);
	}
	return preset;
}

export function resolveAction(preset: Preset, risk: RiskLevel): Action {
	return preset.mapping[risk];
}

export function isValidPresetName(name: string): name is PresetName {
	return PRESET_NAMES.has(name);
}

export { PRESETS };
