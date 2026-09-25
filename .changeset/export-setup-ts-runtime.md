---
'@modern-js/app-tools': patch
---

feat(app-tools): export `setupTsRuntime` and `resolveTsRuntimeRegisterMode` from the public entry

The server TypeScript runtime setup app-tools' own dev/build commands use
(ts-node when the project depends on it, Node.js native TypeScript as the
fallback, plus tsconfig-paths/alias registration) is now part of the public
API, so frameworks composing app-tools in-process (running their own command
actions instead of app-tools') can register the same runtime without keeping
a private copy of the logic. Also exports the `TsRuntimeRegisterMode` and
`TsRuntimeSetupOptions` types.
