---
'@modern-js/runtime': patch
'@modern-js/plugin': minor
---

Pass request, nonce, shell marker and identifier prefix to streaming SSR extenders. Add bootstrap and abort hooks so composed streams can initialize before entry scripts and release work when rendering fails or output is cancelled. Keep ordinary response templates unchanged and align the streaming hydration tree with the server tree.

向流式 SSR 扩展传递请求、nonce、shell 标记与 identifier prefix。新增 bootstrap 和 abort 钩子，让组合流能在入口脚本执行前初始化，并在渲染失败或输出取消时释放工作。普通响应模板保持原样，流式水合的 React 树与服务端对齐。
