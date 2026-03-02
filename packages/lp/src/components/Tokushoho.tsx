import { LegalPage } from "./LegalPage";
import type { Lang } from "../types";

const TITLE = { en: "特定商取引法に基づく表示", jp: "特定商取引法に基づく表示" } as const;

const ROWS = [
	{ label: "販売業者", value: "ClawGuard" },
	{ label: "運営統括責任者", value: "請求があった場合に遅滞なく開示いたします" },
	{ label: "所在地", value: "請求があった場合に遅滞なく開示いたします" },
	{ label: "電話番号", value: "請求があった場合に遅滞なく開示いたします" },
	{ label: "メールアドレス", value: "support@clawguard-sec.com", isEmail: true },
	{
		label: "販売価格",
		value: [
			"Free プラン: 無料",
			"Pro プラン: $12/月（税込）",
			"Max プラン: $39/月（税込）",
		],
	},
	{ label: "販売価格以外の必要料金", value: "インターネット接続に必要な通信料はお客様のご負担となります" },
	{ label: "支払方法", value: "クレジットカード（Stripe経由）" },
	{ label: "支払時期", value: "お申し込み時に即時決済。以降、毎月同日に自動更新されます" },
	{ label: "サービス提供開始時期", value: "決済完了後、即時ご利用いただけます" },
	{
		label: "返品・キャンセル",
		value: [
			"デジタルサービスの性質上、返品はお受けしておりません。",
			"サブスクリプションはいつでも解約可能です。解約後も当月末までご利用いただけます。",
		],
	},
	{
		label: "動作環境",
		value: [
			"Node.js 18以上",
			"対応OS: macOS / Linux / Windows",
		],
	},
] as const;

export function Tokushoho({ lang }: { lang: Lang }) {
	return (
		<LegalPage title={TITLE[lang]} lang={lang}>
			<p className="text-sm text-gray-500 mb-8">最終更新日: 2026年3月2日</p>

			<div className="overflow-hidden rounded-lg border border-gray-800">
				<table className="w-full text-sm">
					<tbody>
						{ROWS.map((row) => (
							<tr key={row.label} className="border-b border-gray-800 last:border-b-0">
								<th className="bg-gray-900/50 px-4 py-4 text-left font-medium text-gray-300 w-1/3 align-top whitespace-nowrap">
									{row.label}
								</th>
								<td className="px-4 py-4 text-gray-400">
									<CellValue row={row} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</LegalPage>
	);
}

function CellValue({ row }: { row: (typeof ROWS)[number] }) {
	if ("isEmail" in row && row.isEmail) {
		return (
			<a href={`mailto:${row.value}`} className="text-claw-500 hover:text-claw-400 transition-colors">
				{row.value as string}
			</a>
		);
	}
	if (Array.isArray(row.value)) {
		return (
			<ul className="space-y-1">
				{row.value.map((v) => (
					<li key={v}>{v}</li>
				))}
			</ul>
		);
	}
	return <>{row.value}</>;
}
