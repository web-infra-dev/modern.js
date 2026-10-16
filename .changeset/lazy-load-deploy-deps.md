---
'@modern-js/app-tools': patch
---

perf: load `ndepe` lazily in deploy presets so CLI startup no longer pays for it on every command

perf: 部署预设中按需加载 `ndepe`，避免每个 CLI 命令启动时都加载它
