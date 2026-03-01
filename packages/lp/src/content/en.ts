import type { LPContent } from "../types";

export const en: LPContent = {
	nav: {
		brand: "ClawGuard",
		cta: "Get Started Free",
		links: ["Features", "Pricing", "Docs"],
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
					"100ms real-time risk evaluation with 8 built-in rules. Block destructive commands before they execute.",
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
					"Crowd-sourced safety data from thousands of developers. Reputation network gets smarter with every user.",
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
					"Daily signed rule updates, CVE alerts, and revocation lists. Stay ahead of emerging threats.",
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
					"8 core security rules",
					"Weekly threat feed",
					"Basic replay (24h)",
					"Community read-only",
					"Single agent support",
				],
				cta: "Get Started Free",
			},
			{
				name: "Pro",
				price: "$12",
				period: "/month",
				features: [
					"All security rules",
					"Daily threat feed (rules + reputation + CVE)",
					"Full incident replay",
					"Rule Marketplace access",
					"Security Passport + badge",
					"Skills AV scanning",
				],
				cta: "Start Pro Trial",
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
			},
		],
	},
	howItWorks: {
		title: "Up and Running in 60 Seconds",
		steps: [
			{
				step: "1",
				title: "Install",
				description: "npm install -g claw-guard && claw-guard init",
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
	},
	footer: {
		legal: [
			{ label: "Terms of Service", href: "/legal/terms" },
			{ label: "Privacy Policy", href: "/legal/privacy" },
			{
				label: "\u7279\u5B9A\u5546\u53D6\u5F15\u6CD5\u306B\u57FA\u3065\u304F\u8868\u793A",
				href: "/legal/tokushoho",
			},
		],
		devex: [
			{ label: "API Reference", href: "/docs/api" },
			{ label: "Getting Started", href: "/docs/getting-started" },
			{ label: "Status", href: "https://status.clawguard.dev" },
			{ label: "Changelog", href: "/docs/changelog" },
		],
		support: [
			{ label: "Pricing", href: "#pricing" },
			{ label: "FAQ", href: "/support/faq" },
			{ label: "Contact (Technical)", href: "/support/contact?type=tech" },
			{
				label: "Contact (Billing)",
				href: "/support/contact?type=billing",
			},
		],
		copyright: "\u00A9 2026 ClawGuard. All rights reserved.",
		github: "https://github.com/clawguard",
	},
};
