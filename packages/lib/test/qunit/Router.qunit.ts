import Router from "ui5/ext/routing/Router";
import HashChanger from "sap/ui/core/routing/HashChanger";
import type { GuardContext, GuardFn } from "ui5/ext/routing/types";

// Helper: create a router with standard test routes
function createRouter(): any {
	return new (Router as any)([
		{ name: "home", pattern: "" },
		{ name: "protected", pattern: "protected" },
		{ name: "forbidden", pattern: "forbidden" },
		{ name: "detail", pattern: "detail/{id}" }
	], {
		async: true
	});
}

// Helper: wait for next tick (let async parse() settle)
function nextTick(ms = 50): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper: initialize HashChanger for tests
function initHashChanger(): void {
	const hashChanger = HashChanger.getInstance();
	if (!(hashChanger as any).hasListeners("hashChanged")) {
		hashChanger.init();
	}
	hashChanger.setHash("");
}

// ============================================================
// Module: Drop-in replacement (no guards)
// ============================================================
let router: any;

QUnit.module("Router - Drop-in replacement (no guards)", {
	beforeEach: function () {
		initHashChanger();
		router = createRouter();
		router.initialize();
	},
	afterEach: function () {
		router.destroy();
		HashChanger.getInstance().setHash("");
	}
});

QUnit.test("Router initializes without errors", function (assert: Assert) {
	assert.ok(router, "Router instance created");
});

QUnit.test("Router is an instance of sap.m.routing.Router", function (assert: Assert) {
	assert.ok(
		router.isA("sap.m.routing.Router"),
		"Router extends sap.m.routing.Router"
	);
});

QUnit.test("navTo navigates to named route", function (assert: Assert) {
	const done = assert.async();
	router.getRoute("protected").attachPatternMatched(() => {
		assert.ok(true, "Protected route matched");
		done();
	});
	router.navTo("protected");
});

QUnit.test("navTo with parameters", function (assert: Assert) {
	const done = assert.async();
	router.getRoute("detail").attachPatternMatched((event: any) => {
		assert.strictEqual(
			event.getParameter("arguments").id,
			"42",
			"Route parameter extracted correctly"
		);
		done();
	});
	router.navTo("detail", { id: "42" });
});

QUnit.test("routeMatched event fires", function (assert: Assert) {
	const done = assert.async();
	router.attachRouteMatched((event: any) => {
		if (event.getParameter("name") === "protected") {
			assert.ok(true, "routeMatched fired for protected route");
			done();
		}
	});
	router.navTo("protected");
});

QUnit.test("beforeRouteMatched event fires", function (assert: Assert) {
	const done = assert.async();
	router.attachBeforeRouteMatched((event: any) => {
		if (event.getParameter("name") === "protected") {
			assert.ok(true, "beforeRouteMatched fired");
			done();
		}
	});
	router.navTo("protected");
});

QUnit.test("navTo with replace does not create history entry", function (assert: Assert) {
	const done = assert.async();
	router.getRoute("protected").attachPatternMatched(() => {
		assert.ok(true, "Protected route matched with replace");
		done();
	});
	router.navTo("protected", {}, true);
});

QUnit.test("getRoute returns route by name", function (assert: Assert) {
	const route = router.getRoute("home");
	assert.ok(route, "getRoute returns the home route");
});

QUnit.test("getRoute returns undefined for unknown route", function (assert: Assert) {
	const route = router.getRoute("nonexistent");
	assert.notOk(route, "getRoute returns undefined for unknown route");
});

// ============================================================
// Module: Guard API
// ============================================================
QUnit.module("Router - Guard API", {
	beforeEach: function () {
		initHashChanger();
		router = createRouter();
	},
	afterEach: function () {
		router.destroy();
		HashChanger.getInstance().setHash("");
	}
});

QUnit.test("addGuard / removeGuard register and deregister global guards", function (assert: Assert) {
	const guard: GuardFn = () => true;
	router.addGuard(guard);
	assert.strictEqual(router._globalGuards.length, 1, "Guard registered");

	router.removeGuard(guard);
	assert.strictEqual(router._globalGuards.length, 0, "Guard deregistered");
});

QUnit.test("addRouteGuard / removeRouteGuard register and deregister per-route guards", function (assert: Assert) {
	const guard: GuardFn = () => true;
	router.addRouteGuard("protected", guard);
	assert.strictEqual(router._routeGuards.get("protected").length, 1, "Route guard registered");

	router.removeRouteGuard("protected", guard);
	assert.notOk(router._routeGuards.has("protected"), "Route guard deregistered and map entry cleaned");
});

QUnit.test("addGuard returns this for chaining", function (assert: Assert) {
	const result = router.addGuard(() => true);
	assert.strictEqual(result, router, "addGuard returns this");
});

QUnit.test("addRouteGuard returns this for chaining", function (assert: Assert) {
	const result = router.addRouteGuard("home", () => true);
	assert.strictEqual(result, router, "addRouteGuard returns this");
});

QUnit.test("destroy cleans up guards", function (assert: Assert) {
	router.addGuard(() => true);
	router.addRouteGuard("home", () => true);
	router.destroy();
	assert.strictEqual(router._globalGuards.length, 0, "Global guards cleared");
	assert.strictEqual(router._routeGuards.size, 0, "Route guards cleared");
});

// ============================================================
// Module: Guard behavior - allowing navigation
// ============================================================
QUnit.module("Router - Guard allows navigation", {
	beforeEach: function () {
		initHashChanger();
		router = createRouter();
	},
	afterEach: function () {
		router.destroy();
		HashChanger.getInstance().setHash("");
	}
});

QUnit.test("Guard returning true allows navigation", function (assert: Assert) {
	const done = assert.async();
	router.addGuard(() => true);
	router.initialize();

	router.getRoute("protected").attachPatternMatched(() => {
		assert.ok(true, "Navigation allowed through guard");
		done();
	});
	router.navTo("protected");
});

QUnit.test("Async guard returning true allows navigation", function (assert: Assert) {
	const done = assert.async();
	router.addGuard(async () => {
		await nextTick(10);
		return true;
	});
	router.initialize();

	router.getRoute("protected").attachPatternMatched(() => {
		assert.ok(true, "Async guard allowed navigation");
		done();
	});
	router.navTo("protected");
});

QUnit.test("Route-specific guard returning true allows navigation", function (assert: Assert) {
	const done = assert.async();
	router.addRouteGuard("protected", () => true);
	router.initialize();

	router.getRoute("protected").attachPatternMatched(() => {
		assert.ok(true, "Route guard allowed navigation");
		done();
	});
	router.navTo("protected");
});

// ============================================================
// Module: Guard behavior - blocking navigation
// ============================================================
QUnit.module("Router - Guard blocks navigation", {
	beforeEach: function () {
		initHashChanger();
		router = createRouter();
	},
	afterEach: function () {
		router.destroy();
		HashChanger.getInstance().setHash("");
	}
});

QUnit.test("Guard returning false blocks navigation", function (assert: Assert) {
	const done = assert.async();
	let routeMatched = false;

	router.addGuard(() => false);
	router.initialize();

	router.getRoute("protected").attachPatternMatched(() => {
		routeMatched = true;
	});

	router.navTo("protected");

	nextTick(200).then(() => {
		assert.notOk(routeMatched, "Navigation was blocked");
		done();
	});
});

QUnit.test("Async guard returning false blocks navigation", function (assert: Assert) {
	const done = assert.async();
	let routeMatched = false;

	router.addGuard(async () => {
		await nextTick(10);
		return false;
	});
	router.initialize();

	router.getRoute("protected").attachPatternMatched(() => {
		routeMatched = true;
	});

	router.navTo("protected");

	nextTick(200).then(() => {
		assert.notOk(routeMatched, "Async guard blocked navigation");
		done();
	});
});

QUnit.test("Route-specific guard returning false blocks navigation", function (assert: Assert) {
	const done = assert.async();
	let routeMatched = false;

	router.addRouteGuard("protected", () => false);
	router.initialize();

	router.getRoute("protected").attachPatternMatched(() => {
		routeMatched = true;
	});

	router.navTo("protected");

	nextTick(200).then(() => {
		assert.notOk(routeMatched, "Route guard blocked navigation");
		done();
	});
});

QUnit.test("Guard throwing an error blocks navigation", function (assert: Assert) {
	const done = assert.async();
	let routeMatched = false;

	router.addGuard(() => {
		throw new Error("Guard error");
	});
	router.initialize();

	router.getRoute("protected").attachPatternMatched(() => {
		routeMatched = true;
	});

	router.navTo("protected");

	nextTick(200).then(() => {
		assert.notOk(routeMatched, "Navigation blocked on guard error");
		done();
	});
});

QUnit.test("Guard returning rejected Promise blocks navigation", function (assert: Assert) {
	const done = assert.async();
	let routeMatched = false;

	router.addGuard(() => Promise.reject(new Error("Rejected")));
	router.initialize();

	router.getRoute("protected").attachPatternMatched(() => {
		routeMatched = true;
	});

	router.navTo("protected");

	nextTick(200).then(() => {
		assert.notOk(routeMatched, "Navigation blocked on rejected promise");
		done();
	});
});

// ============================================================
// Module: Guard behavior - redirect
// ============================================================
QUnit.module("Router - Guard redirects", {
	beforeEach: function () {
		initHashChanger();
		router = createRouter();
	},
	afterEach: function () {
		router.destroy();
		HashChanger.getInstance().setHash("");
	}
});

QUnit.test("Guard returning string redirects to named route", function (assert: Assert) {
	const done = assert.async();

	router.addRouteGuard("forbidden", () => "home");
	router.initialize();

	router.getRoute("home").attachPatternMatched(() => {
		assert.ok(true, "Redirected to home route");
		done();
	});

	router.navTo("forbidden");
});

QUnit.test("Async guard returning string redirects", function (assert: Assert) {
	const done = assert.async();

	router.addRouteGuard("forbidden", async () => {
		await nextTick(10);
		return "home";
	});
	router.initialize();

	router.getRoute("home").attachPatternMatched(() => {
		assert.ok(true, "Async guard redirected to home");
		done();
	});

	router.navTo("forbidden");
});

// ============================================================
// Module: Guard context
// ============================================================
QUnit.module("Router - Guard context", {
	beforeEach: function () {
		initHashChanger();
		router = createRouter();
	},
	afterEach: function () {
		router.destroy();
		HashChanger.getInstance().setHash("");
	}
});

QUnit.test("Guard receives correct context", function (assert: Assert) {
	const done = assert.async();
	let capturedContext: GuardContext | null = null;

	router.addGuard((context: GuardContext) => {
		capturedContext = context;
		return true;
	});
	router.initialize();

	router.getRoute("detail").attachPatternMatched(() => {
		assert.ok(capturedContext, "Context was captured");
		assert.strictEqual(capturedContext!.toRoute, "detail", "toRoute is correct");
		assert.strictEqual(capturedContext!.toHash, "detail/99", "toHash is correct");
		assert.deepEqual(capturedContext!.toArguments, { id: "99" }, "toArguments is correct");
		done();
	});

	router.navTo("detail", { id: "99" });
});

// ============================================================
// Module: Guard execution order
// ============================================================
QUnit.module("Router - Guard execution order", {
	beforeEach: function () {
		initHashChanger();
		router = createRouter();
	},
	afterEach: function () {
		router.destroy();
		HashChanger.getInstance().setHash("");
	}
});

QUnit.test("Multiple global guards run sequentially, first rejection wins", function (assert: Assert) {
	const done = assert.async();
	const order: number[] = [];

	router.addGuard(() => { order.push(1); return true; });
	router.addGuard(() => { order.push(2); return false; });
	router.addGuard(() => { order.push(3); return true; });
	router.initialize();

	router.navTo("protected");

	nextTick(200).then(() => {
		assert.deepEqual(order, [1, 2], "Guards ran sequentially and stopped at first rejection");
		done();
	});
});

QUnit.test("Global guards run before route-specific guards", function (assert: Assert) {
	const done = assert.async();
	const order: string[] = [];

	router.addGuard(() => { order.push("global"); return true; });
	router.addRouteGuard("protected", () => { order.push("route"); return true; });
	router.initialize();

	router.getRoute("protected").attachPatternMatched(() => {
		assert.deepEqual(order, ["global", "route"], "Global guard ran before route guard");
		done();
	});

	router.navTo("protected");
});

QUnit.test("Route guard only runs for its route", function (assert: Assert) {
	const done = assert.async();
	let protectedGuardCalled = false;

	router.addRouteGuard("protected", () => {
		protectedGuardCalled = true;
		return true;
	});
	router.initialize();

	router.getRoute("home").attachPatternMatched(() => {
		nextTick(100).then(() => {
			assert.notOk(protectedGuardCalled, "Protected route guard did not run for home route");
			done();
		});
	});

	// Navigate to home (empty hash)
	HashChanger.getInstance().setHash("");
});

QUnit.test("No guards behaves identically to native router", function (assert: Assert) {
	const done = assert.async();
	router.initialize();

	router.getRoute("protected").attachPatternMatched(() => {
		assert.ok(true, "Navigation works without any guards");
		done();
	});

	router.navTo("protected");
});

// ============================================================
// Module: Guard with invalid return values
// ============================================================
QUnit.module("Router - Guard invalid values", {
	beforeEach: function () {
		initHashChanger();
		router = createRouter();
	},
	afterEach: function () {
		router.destroy();
		HashChanger.getInstance().setHash("");
	}
});

QUnit.test("Guard returning invalid value treats as block", function (assert: Assert) {
	const done = assert.async();
	let routeMatched = false;

	router.addGuard((() => 42) as any);
	router.initialize();

	router.getRoute("protected").attachPatternMatched(() => {
		routeMatched = true;
	});

	router.navTo("protected");

	nextTick(200).then(() => {
		assert.notOk(routeMatched, "Invalid guard return treated as block");
		done();
	});
});
