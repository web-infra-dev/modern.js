---
'@modern-js/mcp-apps': patch
---

Normalize legacy views consistently when creating and binding UI manifests. Remove the resource utility dependency cycle. Treat assetBase as a directory URL, require a head element for base injection, and preserve explicitly configured CSP connection permissions without automatically adding the asset origin.
