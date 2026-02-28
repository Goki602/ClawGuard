export function Header() {
	return (
		<header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
			<div className="flex items-center gap-3">
				<div className="w-8 h-8 bg-claw-600 rounded-lg flex items-center justify-center font-bold text-sm">
					CG
				</div>
				<div>
					<h1 className="text-lg font-semibold">ClawGuard</h1>
					<p className="text-xs text-gray-500">Security Dashboard</p>
				</div>
			</div>
			<div className="text-xs text-gray-500">v0.1.0</div>
		</header>
	);
}
