export type PaidPlan = "pro" | "max";

const PRICE_TO_PLAN: Record<number, PaidPlan> = {
	1200: "pro",
	3900: "max",
};

export function resolvePlan(amountCents: number): PaidPlan | null {
	return PRICE_TO_PLAN[amountCents] ?? null;
}

export function generateLicenseKey(plan: PaidPlan): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	const hex = Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return `cg_${plan}_${hex}`;
}
