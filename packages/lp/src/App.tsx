import { useCallback, useEffect, useState } from "react";
import { AppBar } from "./components/AppBar";
import { Drawer } from "./components/Drawer";
import { FeatureCards } from "./components/FeatureCards";
import { FooterSection } from "./components/FooterSection";
import { HeroSection } from "./components/HeroSection";
import { HowItWorks } from "./components/HowItWorks";
import { PricingCards } from "./components/PricingCards";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { SecurityBadge } from "./components/SecurityBadge";
import { SuccessPage } from "./components/SuccessPage";
import { Tokushoho } from "./components/Tokushoho";
import { en } from "./content/en";
import { jp } from "./content/jp";
import type { Lang } from "./types";

const contentMap = { en, jp } as const;

type Page = "home" | "privacy" | "tokushoho" | "success";

function getPage(): Page {
	const h = location.hash.replace("#", "");
	if (h === "privacy") return "privacy";
	if (h === "tokushoho") return "tokushoho";
	if (h === "success") return "success";
	return "home";
}

export function App() {
	const [lang, setLang] = useState<Lang>("jp");
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [page, setPage] = useState<Page>(getPage);

	useEffect(() => {
		const onHash = () => {
			const next = getPage();
			setPage(next);
			if (next !== "home") window.scrollTo(0, 0);
		};
		window.addEventListener("hashchange", onHash);
		return () => window.removeEventListener("hashchange", onHash);
	}, []);

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
				{page === "privacy" && <PrivacyPolicy lang={lang} />}
				{page === "tokushoho" && <Tokushoho lang={lang} />}
				{page === "success" && <SuccessPage lang={lang} />}
				{page === "home" && (
					<>
						<HeroSection content={content.hero} />
						<FeatureCards content={content.features} />
						<HowItWorks content={content.howItWorks} />
						<PricingCards content={content.pricing} />
						<SecurityBadge content={content.securityBadge} />
					</>
				)}
			</main>
			<FooterSection content={content.footer} />
		</div>
	);
}
