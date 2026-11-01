// Same format as JS toISOString(); the Java backend writes identical strings so they compare lexicographically.
export const nowIso = (): string => new Date().toISOString();

// The group plays in India, so game times are IST (UTC+05:30, no daylight saving).
export const gameEndsAt = (date: string, timeTo: string): Date => new Date(`${date}T${timeTo}:00+05:30`);
