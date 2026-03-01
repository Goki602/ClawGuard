import type { SecurityPassport } from "@clawguard/core";

export class BadgeGenerator {
	generateUrl(passport: SecurityPassport): string {
		const incidents = passport.summary.incidents;
		const color = incidents === 0 ? "brightgreen" : "yellow";
		const label = "ClawGuard";
		const message = incidents === 0 ? "monitored" : `${incidents} incidents`;
		return `https://img.shields.io/badge/${encodeURIComponent(label)}-${encodeURIComponent(message)}-${color}`;
	}

	generateSvg(passport: SecurityPassport): string {
		const incidents = passport.summary.incidents;
		const bgColor = incidents === 0 ? "#4ade80" : "#facc15";
		const textColor = incidents === 0 ? "#052e16" : "#422006";
		const statusText =
			incidents === 0 ? "Monitored" : `${incidents} incident${incidents > 1 ? "s" : ""}`;
		const labelWidth = 80;
		const statusWidth = Math.max(70, statusText.length * 7 + 16);
		const totalWidth = labelWidth + statusWidth;

		return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="ClawGuard: ${statusText}">
  <title>ClawGuard: ${statusText}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalWidth}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${statusWidth}" height="20" fill="${bgColor}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text aria-hidden="true" x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">ClawGuard</text>
    <text x="${labelWidth / 2}" y="14" fill="#fff">ClawGuard</text>
    <text aria-hidden="true" x="${labelWidth + statusWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${statusText}</text>
    <text x="${labelWidth + statusWidth / 2}" y="14" fill="${textColor}">${statusText}</text>
  </g>
</svg>`;
	}

	generateMarkdown(passport: SecurityPassport): string {
		const badgeUrl = this.generateUrl(passport);
		const since = passport.monitoring_since;
		return `[![ClawGuard](${badgeUrl})](https://github.com/clawguard/clawguard)\n\n> Continuously monitored by [ClawGuard](https://github.com/clawguard/clawguard) since ${since}. ${passport.summary.total_decisions} decisions audited.`;
	}
}
