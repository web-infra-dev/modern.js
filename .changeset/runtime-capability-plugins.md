---
'@modern-js/runtime': patch
'@modern-js/plugin': minor
'@modern-js/plugin-i18n': patch
---

Keep application initialization shared while injecting preparation cancellation and fragment routing through adapter plugins. Allocate route state and cleanup storage only when used, and derive locale entry metadata in the i18n plugin. Ordinary browser entries exclude Bridge and preparation-cancellation implementations.

Separate live synchronous runtime hooks from clonable static hook definitions. Expose createRuntimeSyncHook for registry factories, share completed readiness for synchronous setup, and preserve asynchronous setup ordering, interruption and deterministic cleanup.
