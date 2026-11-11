---
'@modern-js/plugin-module-federation': patch
---

Defer private Service policy lookup until a resolved expose is identified as a Service, allowing ordinary nested Node remotes to initialize without their original server's configuration. Preserve runtime-specific policy ownership and report missing server context only when consuming a Service.
