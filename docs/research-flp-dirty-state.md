# Research: FLP Data Loss Prevention (Dirty State)

> **Date**: 2026-02-08
> **UI5 version analyzed**: SAPUI5 1.144.0
> **Context**: Understanding how FLP's built-in dirty state protection works, its scope, and how it complements the leave guards in this library.

## Summary

SAP Fiori Launchpad provides data loss prevention through a navigation filter in the Shell controller (`_handleDataLoss`). This filter checks dirty state — via `setDirtyFlag`, `registerDirtyStateProvider`, and `setAsyncDirtyStateProvider` — and shows a browser `confirm()` dialog when the user tries to navigate away from an app with unsaved changes.

The FLP mechanism operates at the **shell navigation level**, meaning it intercepts cross-app navigation, browser back/forward, home button clicks, and page refresh/close. It does **not** intercept hash changes that stay within the same app (in-app routing), because those are handled by the app's own router before the shell navigation filter runs.

## Public API

### `sap.ushell.Container.setDirtyFlag(bDirty: boolean): void`

- **Since**: 1.27.0
- **Visibility**: Public
- Sets a simple boolean flag indicating whether there are unsaved changes.
- When `true`, the Shell's `_handleDataLoss` filter will prompt the user on navigation.

```typescript
sap.ushell.Container.setDirtyFlag(true);
sap.ushell.Container.setDirtyFlag(false);
```

**Source**: [`Container-dbg.js` — `setDirtyFlag`](https://ui5.sap.com/1.144.0/resources/sap/ushell/Container-dbg.js)

### `sap.ushell.Container.getDirtyFlag(): boolean`

- **Since**: 1.27.0
- **Visibility**: Public
- **Deprecated since**: 1.120.0
- Returns `true` if the dirty flag is set OR if any registered dirty state provider returns `true`.
- Calls each registered provider with a `NavigationContext` object.

```typescript
const isDirty = sap.ushell.Container.getDirtyFlag();
```

**Deprecation reason**: FLP internally migrated to `getDirtyFlagsAsync()` (private) to support async dirty state providers. The synchronous `getDirtyFlag()` still works but cannot incorporate async providers.

**Source**: [`Container-dbg.js` — `getDirtyFlag`](https://ui5.sap.com/1.144.0/resources/sap/ushell/Container-dbg.js)

### `sap.ushell.Container.registerDirtyStateProvider(fnDirty: Function): void`

- **Since**: 1.31.0
- **Visibility**: Public
- Registers a callback that FLP calls to determine dirty state during navigation.
- The callback receives a `NavigationContext` parameter:

```typescript
interface NavigationContext {
	isCrossAppNavigation: boolean; // true for cross-app, false for inner-app
	innerAppRoute: string; // the target inner-app route hash fragment
}
```

```typescript
const dirtyProvider = (navigationContext) => {
	// Can differentiate between cross-app and inner-app navigation
	if (navigationContext?.isCrossAppNavigation) {
		return myModel.getProperty("/isDirty");
	}
	return false;
};
sap.ushell.Container.registerDirtyStateProvider(dirtyProvider);
```

**Source**: [`Container-dbg.js` — `registerDirtyStateProvider`](https://ui5.sap.com/1.144.0/resources/sap/ushell/Container-dbg.js)

### `sap.ushell.Container.deregisterDirtyStateProvider(fnDirty: Function): void`

- **Since**: 1.67.0
- **Visibility**: Public
- Removes the last registered instance of the given callback from the list of dirty state providers.
- Uses `lastIndexOf` to find and remove the callback (matches by reference).

```typescript
sap.ushell.Container.deregisterDirtyStateProvider(dirtyProvider);
```

**Source**: [`Container-dbg.js` — `deregisterDirtyStateProvider`](https://ui5.sap.com/1.144.0/resources/sap/ushell/Container-dbg.js)

## Private/Internal API (not for application use)

### `sap.ushell.Container.getDirtyFlagsAsync(): Promise<boolean>`

- **Since**: 1.98.0
- **Visibility**: Private
- Returns a Promise resolving to `true` if any sync or async dirty state provider returns `true`, or if the dirty flag is set.
- This is what the Shell controller's `_handleDataLoss` actually uses (in newer versions).

### `sap.ushell.Container.setAsyncDirtyStateProvider(fn: Function): void`

- **Since**: 1.98.0
- **Visibility**: Private (appruntime use only)
- Registers an async dirty state provider. Only one can be set at a time.
- The function must return a `Promise<boolean>`.

## Shell Controller Internals

### `_handleDataLoss` Navigation Filter

The Shell controller (`sap.ushell.renderer.Shell.controller`) registers `_handleDataLoss` as a navigation filter on `ShellNavigationInternal`. This is the central mechanism that enforces data loss protection.

**Flow**:

1. User triggers navigation (click tile, browser back, home button, etc.)
2. `ShellNavigationHashChanger.treatHashChanged` processes the hash change
3. Navigation filters (including `_handleDataLoss`) are called in sequence
4. `_handleDataLoss` calls `Container.getDirtyFlag()` (or `getDirtyFlagsAsync()`)
5. If dirty, shows `window.confirm("Your unsaved changes will be lost...")` dialog
6. Returns `NavigationFilterStatus.Continue` (allow) or `NavigationFilterStatus.Keep` (block)

**Source**: [`Shell-dbg.controller.js` — `_handleDataLoss`](https://ui5.sap.com/1.144.0/resources/sap/ushell/renderer/Shell-dbg.controller.js)

### `_disableSourceAppRouter`

When navigation proceeds after a dirty state confirmation, the Shell controller calls `_disableSourceAppRouter` to prevent the source app's router from reacting to the navigation. This avoids conflicts between the FLP shell navigation and the app's internal router during cross-app transitions.

**Source**: [`Shell-dbg.controller.js` — `_disableSourceAppRouter`](https://ui5.sap.com/1.144.0/resources/sap/ushell/renderer/Shell-dbg.controller.js)

### `NavigationFilterStatus` Enum

Used by navigation filters to communicate their decision:

| Value      | Effect                                            |
| ---------- | ------------------------------------------------- |
| `Continue` | Allow navigation to proceed                       |
| `Custom`   | Custom navigation handling (filter provides hash) |
| `Abandon`  | Cancel navigation entirely                        |
| `Keep`     | Stay on current page (used by `_handleDataLoss`)  |

**Source**: [`ShellNavigationHashChanger-dbg.js`](https://ui5.sap.com/1.144.0/resources/sap/ushell/services/ShellNavigationHashChanger-dbg.js)

### Inner-App vs Cross-App Navigation

`ShellNavigationHashChanger` distinguishes between:

- **Inner-app navigation**: Same semantic object and action, different app route (e.g., `#Order-display&/list` → `#Order-display&/detail/123`). The `&/...` suffix is the inner-app route.
- **Cross-app navigation**: Different semantic object/action (e.g., `#Order-display` → `#Product-manage`).

The `isInnerAppNavigation(newHash, oldHash)` method on the hash changer determines this by comparing the intent portions of the hashes.

## Scope and Limitations

### What FLP dirty state covers

| Trigger                          | Covered | Mechanism                       |
| -------------------------------- | ------- | ------------------------------- |
| Cross-app navigation (tiles)     | Yes     | Shell navigation filter         |
| FLP home button                  | Yes     | Shell navigation filter         |
| Browser back/forward (cross-app) | Yes     | Shell navigation filter         |
| Browser refresh / close          | Yes     | `beforeunload` event (separate) |

### What FLP dirty state does NOT cover

| Trigger                             | Covered | Why                                                    |
| ----------------------------------- | ------- | ------------------------------------------------------ |
| In-app route changes (same app)     | No      | Inner-app hash changes bypass shell navigation filters |
| Programmatic `router.navTo()` calls | No      | These are app-internal, below the FLP shell level      |

### Why inner-app navigation is not covered

When the hash changes but the intent stays the same (inner-app navigation), the `ShellNavigationHashChanger` treats it as an inner-app route change and does not run the full navigation filter pipeline. The dirty state check (`_handleDataLoss`) only runs for shell-level navigation events.

This is by design — FLP assumes apps handle their own internal routing. This is exactly the gap that leave guards fill.

## Complementary Usage Pattern

For complete data loss prevention in a Fiori Launchpad app:

```typescript
// Component.ts
init(): void {
    super.init();
    const router = this.getRouter() as unknown as GuardRouter;

    // 1. Leave guard: protects in-app navigation
    const formModel = new JSONModel({ isDirty: false });
    this.setModel(formModel, "form");

    router.addLeaveGuard("editOrder", (context) => {
        return !formModel.getProperty("/isDirty");
    });

    // 2. FLP dirty state provider: protects cross-app navigation
    if (sap.ushell?.Container) {
        this._dirtyProvider = () => formModel.getProperty("/isDirty");
        sap.ushell.Container.registerDirtyStateProvider(this._dirtyProvider);
    }

    router.initialize();
}

destroy(): void {
    // Clean up FLP provider
    if (sap.ushell?.Container && this._dirtyProvider) {
        sap.ushell.Container.deregisterDirtyStateProvider(this._dirtyProvider);
    }
    super.destroy();
}
```

## Verification Sources

All findings were verified by reading the actual source code from the UI5 CDN:

- [`sap/ushell/Container-dbg.js`](https://ui5.sap.com/1.144.0/resources/sap/ushell/Container-dbg.js) — `setDirtyFlag`, `getDirtyFlag`, `registerDirtyStateProvider`, `deregisterDirtyStateProvider`, `getDirtyFlagsAsync`, `setAsyncDirtyStateProvider`
- [`sap/ushell/renderer/Shell-dbg.controller.js`](https://ui5.sap.com/1.144.0/resources/sap/ushell/renderer/Shell-dbg.controller.js) — `_handleDataLoss`, `_disableSourceAppRouter`
- [`sap/ushell/services/ShellNavigationHashChanger-dbg.js`](https://ui5.sap.com/1.144.0/resources/sap/ushell/services/ShellNavigationHashChanger-dbg.js) — `NavigationFilterStatus`, `treatHashChanged`, inner-app vs cross-app detection

> **Note**: `sap.ushell` is part of SAPUI5 / Fiori Launchpad, not OpenUI5. The UI5 MCP API reference tool cannot resolve `sap.ushell` symbols since this project uses OpenUI5. All API details were obtained from the debug source files on the CDN.
