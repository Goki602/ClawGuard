import type { PaidPlan } from "./license-gen";

export async function sendLicenseEmail(
	to: string,
	licenseKey: string,
	plan: PaidPlan,
	apiKey: string,
): Promise<boolean> {
	const planName = plan === "pro" ? "Pro" : "Max";

	const res = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from: "ClawGuard <noreply@clawguard-sec.com>",
			to: [to],
			subject: `Your ClawGuard ${planName} License Key / ライセンスキーのお届け`,
			html: buildEmailHtml(licenseKey, planName),
		}),
	});

	if (!res.ok) {
		console.error(`Resend API error: ${res.status} ${await res.text()}`);
		return false;
	}
	return true;
}

function buildEmailHtml(licenseKey: string, planName: string): string {
	return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">

<div style="text-align:center;margin-bottom:32px">
<h1 style="color:#e5e5e5;font-size:24px;margin:0">ClawGuard</h1>
<p style="color:#a3a3a3;font-size:14px;margin:8px 0 0">${planName} Plan</p>
</div>

<div style="background:#171717;border:1px solid #262626;border-radius:12px;padding:24px;margin-bottom:24px">
<h2 style="color:#e5e5e5;font-size:18px;margin:0 0 12px">ありがとうございます！</h2>
<p style="color:#a3a3a3;font-size:14px;line-height:1.6;margin:0 0 16px">
ClawGuard ${planName}プランをご購入いただきありがとうございます。<br>
以下があなたのライセンスキーです。
</p>
<div style="background:#0a0a0a;border:1px solid #333;border-radius:8px;padding:16px;text-align:center;margin:0 0 16px">
<code style="color:#4ade80;font-size:14px;word-break:break-all">${licenseKey}</code>
</div>
<p style="color:#a3a3a3;font-size:13px;margin:0 0 8px">ターミナルで以下のコマンドを実行してください:</p>
<div style="background:#0a0a0a;border:1px solid #333;border-radius:8px;padding:12px">
<code style="color:#4ade80;font-size:13px">claw-guard upgrade --key ${licenseKey}</code>
</div>
</div>

<div style="background:#171717;border:1px solid #262626;border-radius:12px;padding:24px;margin-bottom:24px">
<h2 style="color:#e5e5e5;font-size:18px;margin:0 0 12px">Thank you!</h2>
<p style="color:#a3a3a3;font-size:14px;line-height:1.6;margin:0 0 16px">
Thank you for purchasing ClawGuard ${planName}.<br>
Here is your license key:
</p>
<div style="background:#0a0a0a;border:1px solid #333;border-radius:8px;padding:16px;text-align:center;margin:0 0 16px">
<code style="color:#4ade80;font-size:14px;word-break:break-all">${licenseKey}</code>
</div>
<p style="color:#a3a3a3;font-size:13px;margin:0 0 8px">Run this command in your terminal:</p>
<div style="background:#0a0a0a;border:1px solid #333;border-radius:8px;padding:12px">
<code style="color:#4ade80;font-size:13px">claw-guard upgrade --key ${licenseKey}</code>
</div>
</div>

<div style="text-align:center;padding-top:16px;border-top:1px solid #262626">
<p style="color:#525252;font-size:12px;margin:0">
&copy; 2026 ClawGuard &mdash; AI Agent Security Platform<br>
<a href="https://clawguard-sec.com" style="color:#525252">clawguard-sec.com</a> |
<a href="mailto:support@clawguard-sec.com" style="color:#525252">support@clawguard-sec.com</a>
</p>
</div>

</div>
</body>
</html>`;
}
