import { cpSync, rmSync } from "node:fs";
import { build } from "esbuild";

// Clean previous build
rmSync("dist", { recursive: true, force: true });
rmSync("rules", { recursive: true, force: true });

// Bundle all source into single file
await build({
	entryPoints: ["src/index.ts"],
	bundle: true,
	platform: "node",
	format: "esm",
	outfile: "dist/index.js",
	target: "node20",
	external: ["better-sqlite3", "vite", "commander", "chalk", "yaml"],
	// shebang is already in src/index.ts, esbuild preserves it
	sourcemap: true,
	minify: false,
	keepNames: true,
});

// Copy rules into package root (included via "files" in package.json)
cpSync("../../rules", "./rules", { recursive: true });

// Copy docker templates (docker-compose.yml, Dockerfiles, scripts)
rmSync("docker", { recursive: true, force: true });
cpSync("../docker", "./docker", {
	recursive: true,
	filter: (src) =>
		!src.includes("node_modules") &&
		!/\/src(\/|$)/.test(src) &&
		!/\/dist(\/|$)/.test(src) &&
		!src.includes("tsconfig") &&
		!src.includes("package.json") &&
		!src.includes("__tests__"),
});

console.log("Build complete: dist/index.js + rules/ + docker/");
