# Problem Statement

## The Two Missing Pieces in UI5 Routing

UI5's native router (`sap.ui.core.routing.Router` / `sap.m.routing.Router`) has no mechanism to intercept, guard, or cancel navigation **before** route matching and target display occur. This leads to two well-documented problems.

### 1. Back-Navigation to Invalid States

**Reference**: [wridgeu/ui5-poc-ewm-one-login#1](https://github.com/wridgeu/ui5-poc-ewm-one-login/issues/1)

`navTo()` creates browser history entries. After a user completes a step (e.g., login), the browser back button can return them to a screen that should no longer be accessible (e.g., the login page after successful authentication). The framework provides no way to prevent this at the routing level.

### 2. No Route-Level Guards

**Reference**: [SAP/openui5#3411](https://github.com/SAP/openui5/issues/3411), CPOUI5FRAMEWORK-338

There is no way to prevent a route from displaying based on conditions (permissions, authentication state, feature flags). The `beforeRouteMatched` event fires but offers no `preventDefault()` capability. The framework team acknowledged this need (CPOUI5FRAMEWORK-338) but the feature remains unimplemented after 4+ years.

## Current Workaround

Developers scatter guard logic across every controller's `onInit` or `attachPatternMatched` callbacks:

```typescript
// In every protected controller
onInit() {
  this.getRouter().getRoute("protected")
    .attachPatternMatched(this._onRouteMatched, this);
}

_onRouteMatched() {
  if (!this.isLoggedIn()) {
    this.getRouter().navTo("login");
    // Problem: The "protected" view already rendered briefly (flash)
    // Problem: A history entry was created for "protected"
  }
}
```

### Why This Fails

1. **Flash of unauthorized content**: The target view is instantiated and displayed before the controller can redirect. Users see the protected content for a split second.
2. **Polluted history**: The redirect creates additional history entries, making browser back/forward behavior unpredictable.
3. **Scattered logic**: Every protected controller must independently implement the same guard check. This violates DRY and is error-prone.
4. **No centralized control**: There is no single place to define "route X requires condition Y". Guards are implicit, buried in controller lifecycle methods.

## What's Needed

A routing solution that:

- Intercepts navigation **before** any target loading, view creation, or event firing
- Supports async conditions (e.g., checking auth tokens, fetching permissions)
- Allows blocking navigation entirely (stay on current route, clean history)
- Allows redirecting to an alternative route (replace history, no extra entries)
- Provides a centralized registration point (Component level, not scattered across controllers)
- Is a drop-in replacement for `sap.m.routing.Router` (swap `routerClass` in manifest.json)
- Preserves all existing router behavior when no guards are registered
