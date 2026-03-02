import { LicenseManager } from "@clawguard/billing";
import chalk from "chalk";
import { detectLocale } from "../locale.js";

const MSG = {
	ja: {
		removed: "ライセンスを削除しました。Free プランに戻りました。",
		invalidKey: "無効なライセンスキーです。Free プランのままです。",
		activated: (plan: string) => `ライセンス有効化: ${plan} プラン`,
		dailyFeed: "日次フィード",
		reputation: "評判ネットワーク",
		marketplace: "マーケットプレイス",
		enabled: "有効",
		disabled: "無効",
		title: "ClawGuard サブスクリプション",
		currentPlan: (plan: string) => `現在のプラン: ${plan}`,
		upgradeOptions: "アップグレード:",
		proDesc: "$12/月 — 日次フィード、評判ネットワーク、マーケットプレイス、ルール無制限",
		maxDesc: "$39/月 — Pro全機能 + チーム管理、クロスチーム記憶",
		activate: (cmd: string) => `有効化: ${cmd}`,
		features: "機能:",
		rules: "ルール: 無制限",
		feed: "フィード",
	},
	en: {
		removed: "License removed. Reverted to Free plan.",
		invalidKey: "Invalid license key. Staying on free plan.",
		activated: (plan: string) => `License activated: ${plan} plan`,
		dailyFeed: "Daily feed",
		reputation: "Reputation network",
		marketplace: "Marketplace",
		enabled: "enabled",
		disabled: "disabled",
		title: "ClawGuard Subscription",
		currentPlan: (plan: string) => `Current plan: ${plan}`,
		upgradeOptions: "Upgrade options:",
		proDesc: "$12/month — Daily feed, reputation network, marketplace, unlimited rules",
		maxDesc: "$39/month — All Pro features + team management, cross-team memory",
		activate: (cmd: string) => `Activate: ${cmd}`,
		features: "Features:",
		rules: "Rules: unlimited",
		feed: "Feed",
	},
};

export async function upgradeCommand(plan?: string, options?: { key?: string; remove?: boolean }): Promise<void> {
	const m = MSG[detectLocale()];
	const manager = new LicenseManager();
	const onOff = (v: boolean) => (v ? m.enabled : m.disabled);

	if (options?.remove) {
		manager.removeLicense();
		console.log(`${chalk.green("✓")} ${m.removed}`);
		return;
	}

	if (options?.key) {
		const license = manager.saveLicense(options.key);
		if (license.plan === "free") {
			console.log(chalk.red(m.invalidKey));
		} else {
			console.log(
				`${chalk.green("✓")} ${m.activated(chalk.bold(license.plan.toUpperCase()))}`,
			);
			console.log(
				`  ${m.dailyFeed}: ${license.features.feed_interval === "daily" ? m.enabled : m.disabled}`,
			);
			console.log(`  ${m.reputation}: ${onOff(license.features.reputation_network)}`);
			console.log(`  ${m.marketplace}: ${onOff(license.features.marketplace)}`);
		}
		return;
	}

	const current = manager.getCurrentLicense();
	console.log(chalk.bold(m.title));
	console.log(`  ${m.currentPlan(chalk.cyan(current.plan.toUpperCase()))}`);
	console.log("");

	if (current.plan === "free") {
		console.log(m.upgradeOptions);
		console.log(`  ${chalk.green("Pro")}  ${m.proDesc}`);
		console.log(`  ${chalk.blue("Max")}  ${m.maxDesc}`);
		console.log("");
		console.log(m.activate(chalk.cyan("claw-guard upgrade --key <your-license-key>")));
	} else {
		console.log(m.features);
		console.log(`  ${m.rules}`);
		console.log(`  ${m.feed}: ${current.features.feed_interval}`);
		console.log(`  ${m.reputation}: ${onOff(current.features.reputation_network)}`);
		console.log(`  ${m.marketplace}: ${onOff(current.features.marketplace)}`);
	}
}
