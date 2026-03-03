export interface StripeEvent {
	id: string;
	type: string;
	data: {
		object: StripeCheckoutSession;
	};
}

export interface StripeCheckoutSession {
	id: string;
	customer_email: string | null;
	customer_details: { email: string | null } | null;
	amount_total: number;
	currency: string;
	payment_status: string;
}

const TIMESTAMP_TOLERANCE_SEC = 300;

export async function verifyStripeSignature(
	payload: string,
	sigHeader: string,
	secret: string,
): Promise<StripeEvent> {
	const parts: Record<string, string> = {};
	for (const part of sigHeader.split(",")) {
		const eq = part.indexOf("=");
		if (eq > 0) parts[part.slice(0, eq)] = part.slice(eq + 1);
	}

	const timestamp = parts.t;
	const expectedSig = parts.v1;
	if (!timestamp || !expectedSig) {
		throw new Error("Invalid signature header");
	}

	const now = Math.floor(Date.now() / 1000);
	if (Math.abs(now - Number(timestamp)) > TIMESTAMP_TOLERANCE_SEC) {
		throw new Error("Timestamp out of tolerance");
	}

	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);

	const signatureBytes = await crypto.subtle.sign(
		"HMAC",
		key,
		encoder.encode(`${timestamp}.${payload}`),
	);

	const computedSig = Array.from(new Uint8Array(signatureBytes))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	if (!timingSafeEqual(computedSig, expectedSig)) {
		throw new Error("Signature mismatch");
	}

	return JSON.parse(payload) as StripeEvent;
}

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let mismatch = 0;
	for (let i = 0; i < a.length; i++) {
		mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return mismatch === 0;
}
