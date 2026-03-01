export interface CodexApprovalInput {
	type: string;
	tool: string;
	command?: string;
	path?: string;
	url?: string;
	content?: string;
	session_id: string;
	cwd: string;
	sandbox_mode?: string;
}

export interface CodexApprovalOutput {
	action: "approve" | "reject" | "ask";
	reason?: string;
}

export function shouldIntervene(sandboxMode?: string): boolean {
	return sandboxMode !== "full";
}
