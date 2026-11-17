---
'@modern-js/plugin-module-federation': patch
'@modern-js/server-core': patch
---

After receiving ready producer notifications, wait for queued Node updates before admitting new development SSR requests. Continue serving the existing generation while a known producer is still compiling, and discover ready static builds through manifest fallback. Allow the application admission hook to return a response directly when readiness fails.
