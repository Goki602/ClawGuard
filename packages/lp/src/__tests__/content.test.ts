import { describe, expect, it } from "vitest";
import { en } from "../content/en";
import { jp } from "../content/jp";

describe("LP content", () => {
	it("EN content has all required sections", () => {
		expect(en.nav).toBeDefined();
		expect(en.hero).toBeDefined();
		expect(en.features).toBeDefined();
		expect(en.pricing).toBeDefined();
		expect(en.howItWorks).toBeDefined();
		expect(en.securityBadge).toBeDefined();
		expect(en.footer).toBeDefined();
	});

	it("JP content has all required sections", () => {
		expect(jp.nav).toBeDefined();
		expect(jp.hero).toBeDefined();
		expect(jp.features).toBeDefined();
		expect(jp.pricing).toBeDefined();
		expect(jp.howItWorks).toBeDefined();
		expect(jp.securityBadge).toBeDefined();
		expect(jp.footer).toBeDefined();
	});

	it("EN and JP have same number of features", () => {
		expect(en.features.cards.length).toBe(jp.features.cards.length);
		expect(en.features.cards.length).toBe(6);
	});

	it("EN and JP have same number of pricing plans", () => {
		expect(en.pricing.cards.length).toBe(jp.pricing.cards.length);
		expect(en.pricing.cards.length).toBe(1);
	});

	it("all pricing plans have CTA", () => {
		for (const card of en.pricing.cards) {
			expect(card.cta).toBeTruthy();
		}
		for (const card of jp.pricing.cards) {
			expect(card.cta).toBeTruthy();
		}
	});

	it("footer has legal section", () => {
		expect(en.footer.legal.length).toBeGreaterThan(0);
		expect(jp.footer.legal.length).toBeGreaterThan(0);
		for (const item of en.footer.legal) {
			expect(item.label).toBeTruthy();
			expect(item.href).toBeTruthy();
		}
	});

	it("footer has devex section", () => {
		expect(en.footer.devex.length).toBeGreaterThan(0);
		expect(jp.footer.devex.length).toBeGreaterThan(0);
		for (const item of en.footer.devex) {
			expect(item.label).toBeTruthy();
			expect(item.href).toBeTruthy();
		}
	});

	it("footer has support section", () => {
		expect(en.footer.support.length).toBeGreaterThan(0);
		expect(jp.footer.support.length).toBeGreaterThan(0);
		for (const item of en.footer.support) {
			expect(item.label).toBeTruthy();
			expect(item.href).toBeTruthy();
		}
	});

	it("hero has headline and CTA", () => {
		expect(en.hero.headline).toBeTruthy();
		expect(en.hero.cta).toBeTruthy();
		expect(jp.hero.headline).toBeTruthy();
		expect(jp.hero.cta).toBeTruthy();
	});

	it("HowItWorks has 3 steps", () => {
		expect(en.howItWorks.steps.length).toBe(3);
		expect(jp.howItWorks.steps.length).toBe(3);
		for (const step of en.howItWorks.steps) {
			expect(step.step).toBeTruthy();
			expect(step.title).toBeTruthy();
			expect(step.description).toBeTruthy();
		}
	});
});
