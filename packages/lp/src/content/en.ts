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
		headline: "Make AI Agents Trustworthy",
		subheadline:
			"Real-time policy enforcement, community intelligence, and compliance proof for every AI agent session.",
		cta: "Get Started Free",
		secondaryCta: "View on GitHub",
	},
	features: {
		title: "Why ClawGuard?",
		cards: [
			{
				title: "Policy Engine",
				description:
					"100ms real-time risk evaluation with 12 built-in rules. Block destructive commands before they execute.",
				icon: "\u{1F6E1}",
			},
			{
				title: "Cross-Platform",
				description:
					"Works with Claude Code, Codex, MCP, and any AI agent. One security layer for all your tools.",
				icon: "\u{1F517}",
			},
			{
				title: "Community Intelligence",
				description:
					"Opt-in anonymized decision data helps the community. Reputation network gets smarter with every user.",
				icon: "\u{1F310}",
			},
			{
				title: "Security Passport",
				description:
					"Continuous monitoring proof for your projects. Generate GitHub badges that prove compliance.",
				icon: "\u{1F4DC}",
			},
			{
				title: "Incident Replay",
				description:
					"Full decision chain analysis with causal investigation. Replay any AI agent session step by step.",
				icon: "\u{1F50D}",
			},
			{
				title: "Threat Feed",
				description:
					"Signed rule updates, CVE alerts, and revocation lists. Free: weekly. Pro/Max: daily.",
				icon: "\u{1F4E1}",
			},
		],
	},
	pricing: {
		title: "Simple, Transparent Pricing",
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
				cta: "Start Pro Trial",
				href: "https://buy.stripe.com/test_dRmaEWbjp9yC7Kv8hNb3q00",
				highlighted: true,
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
					"Priority support",
				],
				cta: "Start Max Trial",
				href: "https://buy.stripe.com/test_8x2eVcfzFaCGaWHdC7b3q01",
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
				title: "Configure",
				description: "Choose your preset: observer, guardian, balanced, or expert.",
			},
			{
				step: "3",
				title: "Protected",
				description: "Your AI agent now runs with real-time guardrails. Every decision is audited.",
			},
		],
	},
	securityBadge: {
		title: "Security Passport",
		description:
			"Prove your AI agent sessions are continuously monitored. Embed a verifiable badge in your repository.",
		badgeText: "Protected by ClawGuard",
		embedLabel: "Add to your README.md",
		copyButton: "Copy",
		copiedText: "Copied!",
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
