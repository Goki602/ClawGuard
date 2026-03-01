import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TtlCache } from "../cache.js";

describe("TtlCache", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("stores and retrieves values", () => {
		const cache = new TtlCache<string>(60);
		cache.set("key1", "value1");
		expect(cache.get("key1")).toBe("value1");
	});

	it("returns undefined for missing keys", () => {
		const cache = new TtlCache<string>(60);
		expect(cache.get("missing")).toBeUndefined();
	});

	it("expires entries after TTL", () => {
		const cache = new TtlCache<string>(5);
		cache.set("key1", "value1");
		expect(cache.get("key1")).toBe("value1");

		vi.advanceTimersByTime(6000);
		expect(cache.get("key1")).toBeUndefined();
	});

	it("does not expire entries before TTL", () => {
		const cache = new TtlCache<string>(10);
		cache.set("key1", "value1");

		vi.advanceTimersByTime(9000);
		expect(cache.get("key1")).toBe("value1");
	});

	it("clears all entries", () => {
		const cache = new TtlCache<string>(60);
		cache.set("a", "1");
		cache.set("b", "2");
		cache.clear();
		expect(cache.get("a")).toBeUndefined();
		expect(cache.get("b")).toBeUndefined();
	});
});
