/**
 * @module reuse
 *
 * Provides utilities for reusing values within objects, preventing unnecessary
 * re-creation of values and ensuring consistent references across multiple accesses.
 *
 * This module is particularly useful for:
 * - Caching computed values
 * - Ensuring singleton-like behavior within objects
 * - Preventing duplicate initialization
 *
 * @example
 * ```typescript
 * const container = {};
 * const value = reuse(container, new ExpensiveObject());
 * // Subsequent calls will return the same instance
 * const sameValue = reuse(container, new ExpensiveObject());
 * ```
 */

const reuseSymbol = Symbol("reuse");

/**
 * Stores a value in a container and reuse it on subsequent calls.
 * @param container - The container to reuse the value in.
 * @param value - The value to reuse.
 * @returns The reused value.
 */
export const reuse = <T>(container: any, value: T): T => {
	if (reuseSymbol in container) {
		return container[reuseSymbol];
	}

	Object.defineProperty(container, reuseSymbol, {
		value,
		writable: false,
		enumerable: false,
		configurable: false,
	});

	return value;
};
