import type { Lang } from "../types";

const MSG = {
	jp: {
		title: "ありがとうございます！",
		subtitle: "決済が完了しました",
		emailSent: "ライセンスキーをご登録のメールアドレスに送信しました。",
		checkEmail: "メールが届かない場合は、迷惑メールフォルダをご確認ください。",
		stepTitle: "有効化の手順",
		step1: "メールに記載されたライセンスキーを確認",
		step2: "以下のコマンドで有効化",
		back: "トップに戻る",
	},
	en: {
		title: "Thank you!",
		subtitle: "Payment completed",
		emailSent: "Your license key has been sent to your email address.",
		checkEmail: "If you don't see it, please check your spam folder.",
		stepTitle: "Activation",
		step1: "Find the license key in your email",
		step2: "Activate with the following command",
		back: "Back to Home",
	},
} as const;

export function SuccessPage({ lang }: { lang: Lang }) {
	const m = MSG[lang];

	return (
		<section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto text-center">
			{/* Check icon */}
			<div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/30">
				<svg className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
					<title>Success</title>
					<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
				</svg>
			</div>

			<h1 className="text-3xl font-bold text-gray-100 mb-2">{m.title}</h1>
			<p className="text-lg text-gray-400 mb-8">{m.subtitle}</p>

			{/* Email notice */}
			<div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6 mb-8 text-left">
				<p className="text-gray-300 mb-2">{m.emailSent}</p>
				<p className="text-sm text-gray-500">{m.checkEmail}</p>
			</div>

			{/* Activation steps */}
			<div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6 mb-10 text-left">
				<h2 className="text-lg font-semibold text-gray-200 mb-4">{m.stepTitle}</h2>
				<ol className="space-y-4 text-gray-300">
					<li className="flex gap-3">
						<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-claw-500/20 text-claw-400 text-sm font-bold">1</span>
						<span>{m.step1}</span>
					</li>
					<li className="flex gap-3">
						<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-claw-500/20 text-claw-400 text-sm font-bold">2</span>
						<span>{m.step2}</span>
					</li>
				</ol>
				<div className="mt-4 rounded bg-gray-950 px-4 py-3 font-mono text-sm text-green-400 overflow-x-auto">
					claw-guard upgrade --key &lt;your-license-key&gt;
				</div>
			</div>

			<a
				href="#"
				className="inline-flex items-center gap-2 text-claw-500 hover:text-claw-400 transition-colors font-medium"
			>
				<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
					<title>Back</title>
					<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
				</svg>
				{m.back}
			</a>
		</section>
	);
}
