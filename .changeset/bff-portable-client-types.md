---
'@modern-js/plugin-bff': patch
---

fix(plugin-bff): re-base relative specifiers when copying cross-project client declarations

The cross-project client generator copied each handler's declaration into `dist/client` verbatim, one directory shallower than its origin, which broke the relative specifiers TypeScript emits. Specifiers are now re-based onto the copy's location so the generated `<package>/api/*` client types resolve in consuming projects.
