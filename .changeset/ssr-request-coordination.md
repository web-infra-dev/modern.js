---
'@modern-js/server-core': minor
'@modern-js/runtime': patch
'@modern-js/runtime-utils': patch
---

feat(server-core): add an opt-in Node SSR request coordinator with bounded admission, explicit work tracking, drain-before-update sequencing and failed-publication recovery. Default renderer integration is not enabled.

feat(server-core): 新增可选的 Node SSR 请求协调原语，支持有界等待、显式工作计数、更新前排空及发布失败恢复；尚未启用默认 renderer 接入。

fix(runtime): propagate streaming cancellation and track renderer, template, deferred, route preload and SSR cache work through completion. Forward an optional request work context through the render pipeline.

fix(runtime): 传播流式渲染取消信号，等待 renderer、模板、deferred、路由预加载和 SSR 缓存任务真正结束，并在渲染链路传递可选请求工作上下文。
