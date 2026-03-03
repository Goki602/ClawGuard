import { sendLicenseEmail } from "./email";
import { generateLicenseKey, resolvePlan } from "./license-gen";
import { type StripeCheckoutSession, type StripeEvent, verifyStripeSignature } from "./stripe";

export interface Env {
	DB: D1Database;
	STRIPE_WEBHOOK_SECRET: string;
	RESEND_API_KEY: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method !== "POST") {
			return new Response("Method not allowed", { status: 405 });
		}

		const url = new URL(request.url);
		if (url.pathname !== "/webhook/stripe") {
			return new Response("Not found", { status: 404 });
		}

		const signature = request.headers.get("stripe-signature");
		if (!signature) {
			return new Response("Missing signature", { status: 400 });
		}

		const body = await request.text();

		let event: StripeEvent;
		try {
			event = await verifyStripeSignature(body, signature, env.STRIPE_WEBHOOK_SECRET);
		} catch {
			return new Response("Invalid signature", { status: 400 });
		}

		if (event.type !== "checkout.session.completed") {
			return new Response("OK", { status: 200 });
		}

		ctx.waitUntil(handleCheckoutCompleted(event, env));

		return new Response("OK", { status: 200 });
	},
};

async function handleCheckoutCompleted(event: StripeEvent, env: Env): Promise<void> {
	const session: StripeCheckoutSession = event.data.object;
	const email = session.customer_email ?? session.customer_details?.email;

	if (!email) {
		console.error(`No email found for session ${session.id}`);
		return;
	}

	const plan = resolvePlan(session.amount_total);
	if (!plan) {
		console.error(`Unknown amount ${session.amount_total} for session ${session.id}`);
		return;
	}

	const licenseKey = generateLicenseKey(plan);

	try {
		await env.DB.prepare(
			`INSERT INTO licenses (stripe_event_id, stripe_session_id, email, license_key, plan, amount_cents)
       VALUES (?, ?, ?, ?, ?, ?)`,
		)
			.bind(event.id, session.id, email, licenseKey, plan, session.amount_total)
			.run();
	} catch (e: unknown) {
		if (e instanceof Error && e.message.includes("UNIQUE")) {
			console.log(`Event ${event.id} already processed, skipping`);
			return;
		}
		throw e;
	}

	const emailSent = await sendLicenseEmail(email, licenseKey, plan, env.RESEND_API_KEY);

	if (emailSent) {
		await env.DB.prepare("UPDATE licenses SET email_sent = 1 WHERE stripe_event_id = ?")
			.bind(event.id)
			.run();
	}
}
