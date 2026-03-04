import type { LPContent } from "../types";

export const en: LPContent = {
	nav: {
		brand: "ClawGuard",
		cta: "Get Started Free",
		links: [
			{ label: "Features", href: "#features" },
			{ label: "Pricing", href: "#pricing" },
			{ label: "Docs", href: "https://github.com/Goki602/ClawGuard" },
		],
	},
	hero: {
		headline: "Stop AI Agents Before They Break Things",
		subheadline:
			"ClawGuard intercepts dangerous commands — rm -rf, git push --force, curl|bash — before your AI agent executes them. One install, real-time protection.",
		cta: "Get Started Free",
		secondaryCta: "View on GitHub",
		terminal: {
			ready: "Ready.",
			agentSession: "--- AI agent session ---",
			command: "$ rm -rf /tmp/project",
			confirmLabel: "Bulk file deletion",
			confirmDetail: "Wrong path could destroy your entire project.",
		},
	},
	features: {
		title: "What ClawGuard Actually Does",
		cards: [
			{
				title: "Intercepts Dangerous Commands",
				description:
					"When your AI agent tries rm -rf /, git push --force, or curl|bash, ClawGuard catches it in under 100ms and asks you to confirm or blocks it. 12 built-in rules cover destructive ops, secret leaks, and untrusted installs.",
				icon: "\u{1F6E1}",
			},
			{
				title: "Works With Any AI Agent",
				description:
					"Claude Code, Codex, MCP — ClawGuard hooks into the tool-call layer. No Docker required. Install once, protect every agent in your workflow.",
				icon: "\u{1F517}",
			},
			{
				title: "Smarter With Every User",
				description:
					'When you allow or deny a command, anonymized data improves detection for everyone. "87% of developers allowed this npm package" — context that helps you decide faster.',
				icon: "\u{1F310}",
			},
			{
				title: "Prove Your Sessions Are Monitored",
				description:
					"Generate a GitHub badge that proves your AI agent sessions are continuously audited. Show clients and teammates that every command was reviewed.",
				icon: "\u{1F4DC}",
			},
			{
				title: "Replay Any AI Session",
				description:
					"Something went wrong? Replay the entire decision chain: what the agent tried, what was blocked, what was allowed, and why. Full causal analysis.",
				icon: "\u{1F50D}",
			},
			{
				title: "Signed Threat Updates",
				description:
					"New CVEs, malicious packages, revoked rules — delivered as signed feeds. Free: weekly. Pro/Max: daily. Your rules stay current without manual work.",
				icon: "\u{1F4E1}",
			},
		],
	},
	pricing: {
		title: "Simple, Transparent Pricing",
		earlyAccessNote:
			"Pro plan is free during Early Access \u2014 install and get full Pro features today.",
		cards: [
			{
				name: "Free",
				price: "$0",
				period: "forever",
				features: [
					"12 core security rules",
					"Weekly threat feed (rules + reputation)",
					"Basic replay (24h)",
					"Community reputation data (read-only)",
					"Single agent support",
				],
				cta: "Get Started Free",
				href: "#how-it-works",
			},
			{
				name: "Pro",
				price: "$12",
				period: "/month",
				features: [
					"All security rules",
					"Daily threat feed (rules + reputation + CVE)",
					"Full incident replay",
					"Rule Marketplace (install & publish)",
					"Security Passport + badge",
					"Skills AV scanning",
				],
				cta: "Start Free \u2014 Early Access",
				href: "#how-it-works",
				highlighted: true,
				highlightLabel: "Popular",
			},
			{
				name: "Max",
				price: "$39",
				period: "/month",
				features: [
					"Everything in Pro",
					"Team & org management",
					"Cross-team memory sharing",
					"Centralized audit dashboard",
					"Organization-wide passport",
				],
				cta: "Coming Soon",
				href: "#how-it-works",
				comingSoon: true,
				comingSoonLabel: "Coming Soon",
			},
		],
	},
	howItWorks: {
		title: "Up and Running in 60 Seconds",
		steps: [
			{
				step: "1",
				title: "Install",
				description: "npm install -g @clawguard-sec/cli && claw-guard init",
			},
			{
				step: "2",
				title: "Choose Your Level",
				description:
					"Pick a preset: guardian (strict), balanced (recommended), or expert (minimal interruption). One line in clawguard.yaml.",
			},
			{
				step: "3",
				title: "Protected",
				description:
					"Next time your AI agent runs rm -rf or git push --force, ClawGuard intercepts it, explains the risk, and asks you to confirm or deny. Every decision is logged.",
			},
		],
	},
	securityBadge: {
		title: "Security Passport",
		description:
			"Prove your AI agent sessions are continuously monitored. Embed a verifiable badge in your repository.",
		badgeText: "Protected by ClawGuard",
		badgeSubtitle: "Verified \u2022 Continuous Monitoring",
		badgeStatus: "Active",
		embedLabel: "Add to your README.md",
		copyButton: "Copy",
		copiedText: "Copied!",
		steps: [
			{
				step: "1",
				title: "Generate",
				description: "Create a passport for your repository with one command.",
				command: "claw-guard passport --generate --repo owner/repo",
			},
			{
				step: "2",
				title: "Publish",
				description: "Upload your passport to the ClawGuard verification server.",
				command: "claw-guard passport --publish --key YOUR_KEY",
			},
			{
				step: "3",
				title: "Embed",
				description: "Copy the badge markdown below and paste it into your README.md.",
			},
		],
	},
	footer: {
		headings: {
			legal: "Legal",
			devex: "Developers",
			support: "Support",
			description: "AI Agent Security Platform",
		},
		legal: [
			{
				label: "License (MIT)",
				href: "https://github.com/Goki602/ClawGuard/blob/main/LICENSE",
			},
			{
				label: "Privacy Policy",
				href: "#privacy",
			},
			{
				label: "\u7279\u5B9A\u5546\u53D6\u5F15\u6CD5\u306B\u57FA\u3065\u304F\u8868\u793A",
				href: "#tokushoho",
			},
		],
		devex: [
			{
				label: "Getting Started",
				href: "https://github.com/Goki602/ClawGuard#quick-start",
			},
			{
				label: "CLI Reference",
				href: "https://github.com/Goki602/ClawGuard/tree/main/packages/cli",
			},
			{
				label: "Changelog",
				href: "https://github.com/Goki602/ClawGuard/blob/main/CHANGELOG.md",
			},
		],
		support: [
			{ label: "Pricing", href: "#pricing" },
			{
				label: "Issues & FAQ",
				href: "https://github.com/Goki602/ClawGuard/issues",
			},
		],
		copyright: "\u00A9 2026 ClawGuard. All rights reserved.",
		github: "https://github.com/Goki602/ClawGuard",
	},
};
