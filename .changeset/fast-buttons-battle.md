---
'@modern-js/app-tools': patch
---

fix: check `ts-node` existence via `package.json` instead of module resolution to avoid false positives from hoisted dependencies

fix: 通过读取 `package.json` 检测 `ts-node` 是否存在，避免因依赖提升等因素导致模块解析误判
