import type { FeedStatus, HealthStatus, LicenseStatus } from "../types";

interface Props {
	health: HealthStatus | null;
	entryCount: number;
	feed: FeedStatus | null;
	license: LicenseStatus | null;
}

const PLAN_COLORS: Record<string, string> = {
	free: "bg-gray-700 text-gray-300",
	pro: "bg-claw-900/50 text-claw-400",
	max: "bg-purple-900/50 text-purple-400",
};

const FEED_COLORS: Record<string, string> = {
	fresh: "text-green-400",
	stale: "text-yellow-400",
	degraded: "text-red-400",
	none: "text-gray-500",
};

export function StatusBar({ health, entryCount, feed, license }: Props) {
	const connected = health?.status === "ok";
	const plan = license?.license?.plan ?? "free";
	const planColor = PLAN_COLORS[plan] ?? PLAN_COLORS.free;

	return (
		<div className="px-6 py-3 flex items-center gap-6 text-sm bg-gray-900/50">
			<div className="flex items-center gap-2">
				<div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
				<span className="text-gray-400">{connected ? "Engine connected" : "Engine offline"}</span>
			</div>
			<span className={`text-xs px-2 py-0.5 rounded font-medium uppercase ${planColor}`}>
				{plan}
			</span>
			{health && <span className="text-gray-500">{health.rules} rules loaded</span>}
			<span className="text-gray-500">{entryCount} decisions today</span>
			{feed && feed.status !== "none" && (
				<span className={"text-gray-500"}>
					Feed: <span className={FEED_COLORS[feed.status]}>{feed.status}</span>
					{feed.version && ` v${feed.version}`}
				</span>
			)}
			{health?.memory && <span className="text-gray-500">Memory: on</span>}
		</div>
	);
}
