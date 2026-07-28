---
'@modern-js/app-tools': patch
---

feat: bundle the rendered docs (from the docs site build output) instead of the MDX sources, so the pages agents read are self-contained — components are rendered and shared fragments inlined. Also ships `llms.txt` as a local index and no longer trims sections.

feat: 随包文档改为分发文档站构建产物而非 MDX 源码，页面自包含（组件已渲染、共享片段已内联）；同时收录 `llms.txt` 作为本地索引，不再裁剪分区。
