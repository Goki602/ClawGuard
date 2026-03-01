import { execFileSync } from "node:child_process";

export interface VerifyResult {
	valid: boolean;
	error?: string;
}

export function verifyCosignSignature(
	blobPath: string,
	signaturePath: string,
	publicKeyPath: string,
): VerifyResult {
	try {
		execFileSync(
			"cosign",
			["verify-blob", "--key", publicKeyPath, "--signature", signaturePath, blobPath],
			{
				timeout: 10_000,
				stdio: "pipe",
			},
		);
		return { valid: true };
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes("ENOENT") || msg.includes("not found")) {
			return { valid: false, error: "cosign not installed" };
		}
		return { valid: false, error: msg.slice(0, 200) };
	}
}

export function isCosignAvailable(): boolean {
	try {
		execFileSync("cosign", ["version"], { timeout: 5000, stdio: "pipe" });
		return true;
	} catch {
		return false;
	}
}
