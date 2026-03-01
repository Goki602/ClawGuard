import { describe, expect, it } from "vitest";
import { extractPackageName } from "../npm-registry.js";

describe("extractPackageName", () => {
	it("extracts from npm install <pkg>", () => {
		expect(extractPackageName("npm install lodash")).toBe("lodash");
	});

	it("extracts from npm i <pkg>", () => {
		expect(extractPackageName("npm i express")).toBe("express");
	});

	it("extracts from npm add <pkg>", () => {
		expect(extractPackageName("npm add react")).toBe("react");
	});

	it("strips version suffix", () => {
		expect(extractPackageName("npm install lodash@^4.0.0")).toBe("lodash");
	});

	it("handles scoped packages", () => {
		expect(extractPackageName("npm install @types/node")).toBe("@types/node");
	});

	it("returns null for npm install without package", () => {
		expect(extractPackageName("npm install")).toBeNull();
	});

	it("returns null for non-npm commands", () => {
		expect(extractPackageName("pip install requests")).toBeNull();
	});
});
