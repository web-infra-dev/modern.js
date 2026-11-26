---
'@modern-js/runtime': minor
'@modern-js/server-core': patch
---

feat: string SSR waits for deferred loader data (promises in the loader result) and adds `server.ssr.deferredDataTimeout`; values still pending after the timeout are loaded by the browser for their own route, so only their `<Await>` regions render later instead of the whole page falling back to client rendering
