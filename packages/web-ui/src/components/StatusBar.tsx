import type { HealthStatus } from "../types";

interface Props {
	health: HealthStatus | null;
	entryCount: number;
}

export function StatusBar({ health, entryCount }: Props) {
	const connected = health?.status === "ok";

	return (
		<div className="px-6 py-3 flex items-center gap-6 text-sm bg-gray-900/50">
			<div className="flex items-center gap-2">
				<div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
				<span className="text-gray-400">{connected ? "Engine connected" : "Engine offline"}</span>
			</div>
			{health && <span className="text-gray-500">{health.rules} rules loaded</span>}
			<span className="text-gray-500">{entryCount} decisions today</span>
		</div>
	);
}
