/**
 * Result of a guard check.
 *
 * - `true`   → allow navigation to proceed
 * - `false`  → block navigation (stay on current route, no history entry)
 * - `string` → redirect to this route name (replaceHash, no history entry)
 */
export type GuardResult = boolean | string;

/**
 * Context passed to guard functions.
 */
export interface GuardContext {
	/** Target route name (empty string if no route matched) */
	toRoute: string;
	/** Raw hash being navigated to */
	toHash: string;
	/** Parsed route parameters */
	toArguments: Record<string, string>;
	/** Current route name (empty string on initial navigation) */
	fromRoute: string;
	/** Current hash */
	fromHash: string;
}

/**
 * A guard function - can be synchronous or asynchronous.
 */
export type GuardFn = (context: GuardContext) => GuardResult | Promise<GuardResult>;
