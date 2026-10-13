---
'@modern-js/runtime': patch
'@modern-js/runtime-utils': patch
---

fix(runtime): keep the original error when a route module fails to load
fix(runtime): 路由模块加载失败时保留原始错误

Preserve module initialization errors across preloads and repeated imports in SSR server bundles, without changing browser bundle error handling.
SSR server bundle 在 preload 和重复 import 后仍保留模块初始化的原始 error，不改变 browser bundle 的错误处理。
