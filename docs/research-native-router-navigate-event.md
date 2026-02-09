# Research: Native UI5 Router "navigate" Event with preventDefault

> **Date**: 2026-02-09
> **Context**: Investigating native UI5 approaches to preventing navigation using the Router's `navigate` event, as discussed in Stack Overflow and demonstrated by boghyon.

## Summary

UI5's `sap.ui.core.routing.Router` fires a `navigate` event that can be intercepted to prevent navigation by calling `event.preventDefault()`. This is a native mechanism that exists in UI5 but is not prominently documented. The approach was shared by boghyon on Stack Overflow and demonstrated in a Plunker example.

**Key limitation**: This approach is synchronous-only. The event handler must return immediately, so async checks (like backend permission calls) cannot be performed within the handler.

## Source References

- [Stack Overflow: Preventing router from navigating](https://stackoverflow.com/questions/29165700/preventing-router-from-navigating/29167292#29167292)
- [Plunker: Navigation prevention example by boghyon](https://embed.plnkr.co/plunk/wp6yes)
- [GitHub Issue #3411: How to interrupt/override ongoing routing?](https://github.com/SAP/openui5/issues/3411)

## The "navigate" Event Approach

### Basic Pattern

The Router's `navigate` event fires before route matching occurs. Calling `preventDefault()` on the event stops the navigation from proceeding.

```xml
<!-- App.view.xml -->
<App id="app" navigate=".onNavigate">
    <!-- pages -->
</App>
```

```javascript
// App.controller.js
onNavigate: function(oEvent) {
    const navModel = this.getOwnerComponent().getModel("nav");
    if (navModel.getProperty("/prevent")) {
        oEvent.preventDefault();

        // Handle browser history to stay in sync
        const { isBack, isBackToPage, isBackToTop } = oEvent.getParameters();
        if (isBack || isBackToPage || isBackToTop) {
            window.history.go(1);  // Undo the back navigation
        } else {
            window.history.go(-1); // Undo the forward navigation
        }
    }
}
```

### Key Considerations

1. **History management**: When blocking navigation triggered by browser back/forward buttons, the browser history is already updated. The handler must call `window.history.go(1)` or `window.history.go(-1)` to restore the correct history state.

2. **Synchronous only**: The `preventDefault()` call must happen synchronously within the event handler. Async operations complete after the navigation has already been committed.

3. **Event parameters**: The event provides parameters like `isBack`, `isBackToPage`, and `isBackToTop` to distinguish navigation direction.

## Comparison with This Library

| Aspect | Native `navigate` Event | This Library (`ui5.ext.routing`) |
| --- | --- | --- |
| Async support | No | Yes (guards can return Promises) |
| Route-specific guards | Manual (check `toRoute` in handler) | Built-in (`addRouteGuard`) |
| Leave guards | Manual implementation | Built-in (`addLeaveGuard`) |
| Redirect support | Manual (`navTo` after prevent) | Built-in (return route name or object) |
| History management | Manual (`history.go`) | Automatic |
| AbortSignal for cleanup | No | Yes |

## The `beforeRouteMatched` Proposal

In GitHub issue #3411, Florian Vogt (UI5 team member) proposed a future `beforeRouteMatched` event:

```javascript
this.getOwnerComponent().getRouter().attachBeforeRouteMatched(function(oEvent) {
    if (!this.hasAccess()) {
        oEvent.preventDefault();
    }
}.bind(this));
```

**Status**: This API has been discussed but was noted to have the same synchronous limitation — "would require the hasAccess method to return synchronously" without async backend calls.

## Recommended Pattern for Native Approach

If using the native `navigate` event without this library:

```javascript
sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function(Controller) {
    "use strict";

    return Controller.extend("app.controller.App", {
        onInit: function() {
            // Alternative: attach via Router API
            const router = this.getOwnerComponent().getRouter();
            router.attachEvent("navigate", this._onNavigate, this);
        },

        _onNavigate: function(oEvent) {
            const hash = oEvent.getParameter("hash");
            const routeInfo = this.getOwnerComponent().getRouter().getRouteInfoByHash(hash);

            // Example: block access to "admin" route
            if (routeInfo?.name === "admin" && !this._isAdmin()) {
                oEvent.preventDefault();
                this._restoreHistory(oEvent);

                // Optionally redirect
                this.getOwnerComponent().getRouter().navTo("home", {}, { replace: true });
            }
        },

        _restoreHistory: function(oEvent) {
            const { isBack, isBackToPage, isBackToTop } = oEvent.getParameters();
            if (isBack || isBackToPage || isBackToTop) {
                window.history.go(1);
            } else {
                window.history.go(-1);
            }
        },

        _isAdmin: function() {
            return this.getOwnerComponent().getModel("auth").getProperty("/isAdmin");
        }
    });
});
```

## Why This Library Exists

The native `navigate` event approach works for simple, synchronous checks but has significant limitations:

1. **No async support**: Permission checks often require backend calls
2. **Manual history management**: Error-prone and easy to get wrong
3. **No route-specific registration**: All logic in one handler
4. **No leave guard concept**: Must be implemented separately
5. **No redirect convenience**: Must manually call `navTo` after preventing

This library (`ui5.ext.routing`) addresses all of these by:
- Supporting Promise-returning guards with proper async handling
- Automatically managing history restoration on block
- Providing route-specific `addRouteGuard` and global `addGuard` methods
- Supporting leave guards via `addLeaveGuard`
- Allowing redirects by returning a route name or `{ route, parameters }` object
