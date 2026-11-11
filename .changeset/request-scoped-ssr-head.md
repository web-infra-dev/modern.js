---
'@modern-js/runtime': patch
---

fix(runtime): isolate Helmet state per SSR render so concurrent string and streaming renders preserve their own head tags without serialization

fix(runtime): 按 SSR 渲染独立收集 Helmet 状态，避免字符串和流式渲染之间的 head 串扰并保留并发
