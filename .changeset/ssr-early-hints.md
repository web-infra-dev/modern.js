---
'@modern-js/app-tools': patch
'@modern-js/server-core': patch
---

feat: support HTTP 103 Early Hints for critical preloads with the opt-in `performance.resourceStages.earlyHints` option.

feat：新增可选配置 `performance.resourceStages.earlyHints`，在 SSR 执行 loader 前通过 HTTP 103 发送分阶段加载选出的首屏预加载提示。
