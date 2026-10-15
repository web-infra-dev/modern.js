---
'@modern-js/runtime': patch
---

perf: search only newly streamed text for the shell end marker in streaming SSR instead of re-decoding and re-scanning the whole buffered shell for every chunk

perf: 流式 SSR 查找 shell 结束标记时只搜索新到达的内容，不再为每个 chunk 重新解码并扫描整个已缓冲的 shell
