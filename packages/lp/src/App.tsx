import { useCallback, useState } from "react";
import { AppBar } from "./components/AppBar";
import { Drawer } from "./components/Drawer";
import { FeatureCards } from "./components/FeatureCards";
import { FooterSection } from "./components/FooterSection";
import { HeroSection } from "./components/HeroSection";
import { HowItWorks } from "./components/HowItWorks";
import { PricingCards } from "./components/PricingCards";
import { SecurityBadge } from "./components/SecurityBadge";
import { en } from "./content/en";
import { jp } from "./content/jp";
import type { Lang } from "./types";

const contentMap = { en, jp } as const;

export function App() {
	const [lang, setLang] = useState<Lang>("en");
	const [drawerOpen, setDrawerOpen] = useState(false);

	const content = contentMap[lang];
	const toggleLang = useCallback(() => setLang((prev) => (prev === "en" ? "jp" : "en")), []);
	const openDrawer = useCallback(() => setDrawerOpen(true), []);
	const closeDrawer = useCallback(() => setDrawerOpen(false), []);

	return (
		<div className="min-h-screen bg-gray-950 text-gray-100">
			<AppBar
				content={content.nav}
				lang={lang}
				onToggleLang={toggleLang}
				onOpenDrawer={openDrawer}
			/>
			<Drawer
				open={drawerOpen}
				onClose={closeDrawer}
				content={content.nav}
				lang={lang}
				onToggleLang={toggleLang}
			/>
			<main>
				<HeroSection content={content.hero} />
				<FeatureCards content={content.features} />
				<HowItWorks content={content.howItWorks} />
				<PricingCards content={content.pricing} />
				<SecurityBadge content={content.securityBadge} />
			</main>
			<FooterSection content={content.footer} />
		</div>
	);
}
