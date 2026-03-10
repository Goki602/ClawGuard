import type { LPContent } from "../types";

export const en: LPContent = {
	nav: {
		brand: "ClawGuard",
		cta: "Get Started",
		links: [
			{ label: "Features", href: "#features" },
			{ label: "Docs", href: "https://github.com/Goki602/ClawGuard" },
		],
	},
	hero: {
		headline: "Your AI Agents Ask Too Many Questions",
		subheadline:
			"ClawGuard remembers what's safe. Once you approve an operation, it's auto-allowed — across sessions, across agents, across tools. Dangerous commands still get caught. But you'll barely notice.",
		cta: "Get Started",
		secondaryCta: "View on GitHub",
		terminal: {
			ready: "Ready. 47 past decisions loaded.",
			agentSession: "--- AI agent session ---",
			command: "$ npm install express",
			confirmLabel: "Auto-allowed",
			confirmDetail: "You approved this 3 days ago. 94% of developers allow it.",
		},
	},
	features: {
		title: "Less Noise. Smarter Agents.",
		cards: [
			{
				title: "Remembers What's Safe",
				description:
					"You said yes to npm install express once. ClawGuard remembers. Next time — auto-allowed. No popup, no interruption. Your approval decisions persist across sessions.",
				icon: "\u{1F9E0}",
			},
			{
				title: "Works Across Every AI Agent",
				description:
					"Claude Code, Codex, Cursor — your trust decisions travel with you. Approve something in Claude, it's remembered in Codex. One brain for all your agents.",
				icon: "\u{1F517}",
			},
			{
				title: "Community Intelligence",
				description:
					'"94% of developers allowed this npm package." When ClawGuard does ask, it shows you what the community decided. Makes the remaining confirmations take 2 seconds.',
				icon: "\u{1F465}",
			},
			{
				title: "Safety Net Built In",
				description:
					"rm -rf, git push --force, curl|bash — the truly dangerous stuff is always caught. 12 built-in rules protect against irreversible damage. Security isn't the headline, but it's always there.",
				icon: "\u{1F6E1}",
			},
			{
				title: "Full Session History",
				description:
					"Every decision — auto-allowed, confirmed, or blocked — is logged. Replay any session, trace any command chain. When something goes wrong, you can see exactly what happened.",
				icon: "\u{1F4CB}",
			},
			{
				title: "Always Up to Date",
				description:
					"New threats, new safe packages, community decisions — delivered daily as signed updates. Your agent gets smarter without you doing anything.",
				icon: "\u{1F4E1}",
			},
		],
	},
	pricing: {
		title: "100% Free & Open Source",
		cards: [
			{
				name: "ClawGuard",
				price: "$0",
				period: "forever",
				features: [
					"Cross-agent decision memory (auto-allow across tools)",
					"Community intelligence (see what others approved)",
					"All safety rules (core + community)",
					"Daily signed updates (new threats + community data)",
					"Full session replay with causal analysis",
					"Rule Marketplace (install & publish)",
					"Security Passport + GitHub badge",
					"Team & org management",
					"Skills security scanning",
				],
				cta: "Get Started",
				href: "#how-it-works",
				highlighted: true,
				highlightLabel: "All Features Included",
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
				title: "Choose How Quiet",
				description:
					"Pick a preset: guardian (asks often), balanced (recommended), or expert (almost silent). One line in clawguard.yaml.",
			},
			{
				step: "3",
				title: "It Learns",
				description:
					"Use your AI agent normally. ClawGuard learns from every decision you make. Within a day, most confirmations disappear — only new or dangerous operations still ask.",
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
			description: "AI Agent Intelligence Layer",
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
			{
				label: "Issues & FAQ",
				href: "https://github.com/Goki602/ClawGuard/issues",
			},
		],
		copyright: "\u00A9 2026 ClawGuard. All rights reserved.",
		github: "https://github.com/Goki602/ClawGuard",
	},
};
