---
'@modern-js/plugin-module-federation': patch
'@modern-js/server-core': patch
---

After receiving ready producer notifications, wait for queued Node updates before admitting new development SSR requests. Continue serving cached JavaScript from the existing generation while a known producer is still compiling, and discover ready static builds through manifest fallback. Allow the application admission hook to return a response directly when readiness fails.

Check Service producer readiness before new SSR requests even when the ready notification has not arrived yet, preventing native HMR reloads from sending stale build identities to a rebuilt producer.
