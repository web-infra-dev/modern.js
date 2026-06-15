---
'@modern-js/runtime': patch
---

fix(runtime): split streaming SSR chunk at SHELL_STREAM_END_MARK so suspense boundary content is not swallowed before shellAfter

fix(runtime): 流式 SSR 在 SHELL_STREAM_END_MARK 位置切分 chunk，避免 suspense 兑现内容被夹在 shellAfter 之前
