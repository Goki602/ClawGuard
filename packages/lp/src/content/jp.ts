import type { LPContent } from "../types";

export const jp: LPContent = {
	nav: {
		brand: "ClawGuard",
		cta: "\u59CB\u3081\u308B",
		links: [
			{ label: "\u6A5F\u80FD", href: "#features" },
			{
				label: "\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8",
				href: "https://github.com/Goki602/ClawGuard/blob/main/README.ja.md",
			},
		],
	},
	hero: {
		headline: "AIエージェント、聞きすぎじゃない？",
		subheadline:
			"ClawGuardが覚えておきます。一度OKした操作は、次から自動で通す。セッション、エージェント、ツールをまたいでも。危ない操作はちゃんと止める。でも気づかないくらい静か。",
		cta: "始める",
		secondaryCta: "GitHubで見る",
		terminal: {
			ready: "準備完了。過去の判断47件を読み込みました。",
			agentSession: "--- AIエージェントセッション ---",
			command: "$ npm install express",
			confirmLabel: "自動許可",
			confirmDetail: "3日前にOK済み。開発者の94%が許可しています。",
		},
	},
	features: {
		title: "もっと静かに。もっと賢く。",
		cards: [
			{
				title: "OKした操作を覚えてくれる",
				description:
					"npm install expressを一度OKしたら、それで終わり。次からは自動で通ります。ポップアップも中断もなし。セッションが変わっても覚えたまま。",
				icon: "\u{1F9E0}",
			},
			{
				title: "どのAIエージェントでも使える",
				description:
					"Claude Code、Codex、Cursor — OKした判断はどこにでもついていきます。Claudeで許可したものはCodexでもそのまま。エージェントが変わっても、頭脳はひとつ。",
				icon: "\u{1F517}",
			},
			{
				title: "みんなの判断が見える",
				description:
					"「開発者の94%がこのパッケージを許可」。確認が出たとき、他の開発者がどうしたかも一緒に表示。迷う時間がぐっと減ります。",
				icon: "\u{1F465}",
			},
			{
				title: "目立たないけど、しっかり守る",
				description:
					"rm -rf、git push --force、curl|bash — 本当にヤバい操作はちゃんと止めます。12のルールが最初から入っていて、取り返しのつかない事故を防ぎます。",
				icon: "\u{1F6E1}",
			},
			{
				title: "全部記録に残る",
				description:
					"自動許可も、確認も、ブロックも — 判断はすべて記録されます。セッションの再生やコマンドの流れも追えるので、何かあったときに「何が起きたか」がすぐわかります。",
				icon: "\u{1F4CB}",
			},
			{
				title: "放っておいても賢くなる",
				description:
					"新しい脅威、安全なパッケージ、みんなの判断データ。署名付きで毎日届きます。何もしなくても、エージェントは日々賢くなっていきます。",
				icon: "\u{1F4E1}",
			},
		],
	},
	pricing: {
		title: "\u5B8C\u5168\u7121\u6599\u30FB\u30AA\u30FC\u30D7\u30F3\u30BD\u30FC\u30B9",
		cards: [
			{
				name: "ClawGuard",
				price: "$0",
				period: "永久無料",
				features: [
					"ツールをまたいで判断を記憶・自動許可",
					"みんなの判断データが見える（コミュニティ知性）",
					"全セーフティルール（コア + コミュニティ）",
					"毎日届く署名付きアップデート",
					"セッションの完全な再生と原因分析",
					"ルールマーケットプレイス（追加も公開も自由）",
					"セキュリティパスポート + GitHubバッジ",
					"チーム・組織での一括管理",
					"スキルのセキュリティスキャン",
				],
				cta: "\u59CB\u3081\u308B",
				href: "#how-it-works",
				highlighted: true,
				highlightLabel: "\u5168\u6A5F\u80FD\u7121\u6599",
			},
		],
	},
	howItWorks: {
		title: "60\u79D2\u3067\u30BB\u30C3\u30C8\u30A2\u30C3\u30D7\u5B8C\u4E86",
		steps: [
			{
				step: "1",
				title: "\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB",
				description: "npm install -g @clawguard-sec/cli && claw-guard init",
			},
			{
				step: "2",
				title: "静かさレベルを選ぶ",
				description:
					"guardian（よく確認）、balanced（おすすめ）、expert（ほぼ無音）から選ぶだけ。設定はclawguard.yamlに1行。",
			},
			{
				step: "3",
				title: "あとは使うだけ",
				description:
					"いつも通りAIエージェントを使ってください。使うほど賢くなります。1日もすればほとんどの確認は消えて、聞いてくるのは初めての操作や危ない操作だけに。",
			},
		],
	},
	securityBadge: {
		title: "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30D1\u30B9\u30DD\u30FC\u30C8",
		description:
			"AI\u30A8\u30FC\u30B8\u30A7\u30F3\u30C8\u30BB\u30C3\u30B7\u30E7\u30F3\u304C\u7D99\u7D9A\u7684\u306B\u76E3\u8996\u3055\u308C\u3066\u3044\u308B\u3053\u3068\u3092\u8A3C\u660E\u3002\u691C\u8A3C\u53EF\u80FD\u306A\u30D0\u30C3\u30B8\u3092\u30EA\u30DD\u30B8\u30C8\u30EA\u306B\u57CB\u3081\u8FBC\u307F\u3002",
		badgeText: "ClawGuard\u3067\u4FDD\u8B77\u6E08\u307F",
		badgeSubtitle: "\u691C\u8A3C\u6E08\u307F \u2022 \u7D99\u7D9A\u76E3\u8996\u4E2D",
		badgeStatus: "\u6709\u52B9",
		embedLabel: "README.md \u306B\u8FFD\u52A0",
		copyButton: "\u30B3\u30D4\u30FC",
		copiedText: "\u30B3\u30D4\u30FC\u6E08\u307F\uFF01",
		steps: [
			{
				step: "1",
				title: "\u751F\u6210",
				description:
					"\u30EA\u30DD\u30B8\u30C8\u30EA\u7528\u306E\u30D1\u30B9\u30DD\u30FC\u30C8\u3092\u30B3\u30DE\u30F3\u30C9\u4E00\u3064\u3067\u4F5C\u6210\u3002",
				command: "claw-guard passport --generate --repo owner/repo",
			},
			{
				step: "2",
				title: "\u516C\u958B",
				description:
					"\u30D1\u30B9\u30DD\u30FC\u30C8\u3092ClawGuard\u306E\u691C\u8A3C\u30B5\u30FC\u30D0\u30FC\u306B\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u3002",
				command: "claw-guard passport --publish --key YOUR_KEY",
			},
			{
				step: "3",
				title: "\u57CB\u3081\u8FBC\u307F",
				description:
					"\u4E0B\u306E\u30D0\u30C3\u30B8\u7528Markdown\u3092\u30B3\u30D4\u30FC\u3057\u3066\u3001README.md\u306B\u8CBC\u308A\u4ED8\u3051\u3002",
			},
		],
	},
	footer: {
		headings: {
			legal: "\u6CD5\u7684\u60C5\u5831",
			devex: "\u958B\u767A\u8005\u5411\u3051",
			support: "\u30B5\u30DD\u30FC\u30C8",
			description: "AIエージェントの知性レイヤー",
		},
		legal: [
			{
				label: "\u30E9\u30A4\u30BB\u30F3\u30B9 (MIT)",
				href: "https://github.com/Goki602/ClawGuard/blob/main/LICENSE",
			},
			{
				label: "\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u30DD\u30EA\u30B7\u30FC",
				href: "#privacy",
			},
			{
				label: "\u7279\u5B9A\u5546\u53D6\u5F15\u6CD5\u306B\u57FA\u3065\u304F\u8868\u793A",
				href: "#tokushoho",
			},
		],
		devex: [
			{
				label: "\u30B9\u30BF\u30FC\u30C8\u30AC\u30A4\u30C9",
				href: "https://github.com/Goki602/ClawGuard/blob/main/README.ja.md#quick-start",
			},
			{
				label: "CLI\u30EA\u30D5\u30A1\u30EC\u30F3\u30B9",
				href: "https://github.com/Goki602/ClawGuard/tree/main/packages/cli",
			},
			{
				label: "\u30C1\u30A7\u30F3\u30B8\u30ED\u30B0",
				href: "https://github.com/Goki602/ClawGuard/blob/main/CHANGELOG.md",
			},
		],
		support: [
			{
				label: "\u8CEA\u554F\u30FB\u4E0D\u5177\u5408\u5831\u544A",
				href: "https://github.com/Goki602/ClawGuard/issues",
			},
		],
		copyright: "\u00A9 2026 ClawGuard. All rights reserved.",
		github: "https://github.com/Goki602/ClawGuard/blob/main/README.ja.md",
	},
};
