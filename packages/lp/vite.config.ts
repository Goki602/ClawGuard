import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	server: { port: 19282 },
	build: { outDir: "dist" },
});
