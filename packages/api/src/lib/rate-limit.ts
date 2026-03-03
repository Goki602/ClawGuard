const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

export async function checkRateLimit(db: D1Database, key: string): Promise<boolean> {
	const now = new Date();
	const windowStart = new Date(now.getTime() - WINDOW_MS).toISOString();

	// Clean expired and get current count
	await db.prepare("DELETE FROM rate_limits WHERE window_start < ?").bind(windowStart).run();

	const row = await db
		.prepare("SELECT count, window_start FROM rate_limits WHERE key = ?")
		.bind(key)
		.first<{ count: number; window_start: string }>();

	if (!row) {
		await db
			.prepare("INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)")
			.bind(key, now.toISOString())
			.run();
		return true;
	}

	if (row.count >= MAX_REQUESTS) {
		return false;
	}

	await db.prepare("UPDATE rate_limits SET count = count + 1 WHERE key = ?").bind(key).run();
	return true;
}
