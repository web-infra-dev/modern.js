---
'@modern-js/runtime': patch
'@modern-js/plugin': minor
'@modern-js/plugin-i18n': patch
---

Keep application initialization shared while injecting preparation cancellation and fragment routing through adapter plugins. Allocate route state and cleanup storage only when used, and derive locale entry metadata in the i18n plugin. Ordinary browser entries exclude Bridge and preparation-cancellation implementations.

Separate live synchronous runtime hooks from clonable static hook definitions. Expose createRuntimeSyncHook for registry factories, share completed readiness for synchronous setup, and preserve asynchronous setup ordering, interruption and deterministic cleanup.

Prepare request aliases before all plugin setup, remove the request-context replacement plugin, and share browser cancellation, render trees and Router cleanup under their owning instance. Reduce plugin dependency metadata and setup-loop callback allocation, and pass disposal reasons to cleanup callbacks.

Browser mounts own one operation from preparation through commit, while document and fragment SSR inject the same request-cancellation plugin.
