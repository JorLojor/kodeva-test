export function createLoginLimiter() {
	const attempts = new Map<string, { count: number; resetAt: number }>();
	return (identifier: string) => {
		const now = Date.now();
		for (const [key, value] of attempts) if (value.resetAt <= now) attempts.delete(key);
		const current = attempts.get(identifier);
		if (current && current.count >= 10) return "Too many login attempts; try again in a minute";
		if (!current && attempts.size >= 10_000) return "Login temporarily busy; try again later";
		attempts.set(identifier, {
			count: (current?.count ?? 0) + 1,
			resetAt: current?.resetAt ?? now + 60_000,
		});
		return null;
	};
}
