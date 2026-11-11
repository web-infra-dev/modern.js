---
'@modern-js/plugin-module-federation': patch
---

Automatically publish and serve Service App endpoints from one producer origin, the server base URL and per-expose service paths. Discover upstream addresses from the final Module Federation Snapshot and keep Host service configuration limited to private request policies.

Replace handwritten producer handler registration with built-in routing, including base URL aliases and optional successful-render caching. Application definitions retain `isService`, while manifests and Snapshots identify services through `servicePath` and a shared `serviceBaseUrl`.
