import { describe, expect, it } from "vitest";
import { mapToToolRequest } from "../mapper.js";
import type { CodexApprovalInput } from "../types.js";

function makeInput(overrides: Partial<CodexApprovalInput>): CodexApprovalInput {
	return {
		type: "approval_needed",
		tool: "bash",
		session_id: "s1",
		cwd: "/home/user",
		...overrides,
	};
}

describe("mapToToolRequest", () => {
	it("maps bash tool correctly", () => {
		const req = mapToToolRequest(makeInput({ tool: "bash", command: "ls -la" }));
		expect(req.tool).toBe("bash");
		expect(req.content).toBe("ls -la");
		expect(req.context.agent).toBe("codex");
		expect(req.context.working_dir).toBe("/home/user");
		expect(req.context.session_id).toBe("s1");
	});

	it("maps write_file to file_write", () => {
		const req = mapToToolRequest(makeInput({ tool: "write_file", path: "/tmp/test.ts" }));
		expect(req.tool).toBe("file_write");
	});

	it("maps edit_file to file_write", () => {
		const req = mapToToolRequest(makeInput({ tool: "edit_file", path: "/tmp/test.ts" }));
		expect(req.tool).toBe("file_write");
	});

	it("maps browser to network", () => {
		const req = mapToToolRequest(makeInput({ tool: "browser", url: "https://example.com" }));
		expect(req.tool).toBe("network");
	});

	it("maps fetch_url to network", () => {
		const req = mapToToolRequest(makeInput({ tool: "fetch_url", url: "https://example.com" }));
		expect(req.tool).toBe("network");
	});

	it("maps unknown tool to unknown", () => {
		const req = mapToToolRequest(makeInput({ tool: "custom_tool" }));
		expect(req.tool).toBe("unknown");
	});

	it("extracts path as content for file ops", () => {
		const req = mapToToolRequest(makeInput({ tool: "write_file", path: "/tmp/output.ts" }));
		expect(req.content).toBe("/tmp/output.ts");
	});

	it("extracts url as content for browser", () => {
		const req = mapToToolRequest(makeInput({ tool: "browser", url: "https://example.com/page" }));
		expect(req.content).toBe("https://example.com/page");
	});
});
