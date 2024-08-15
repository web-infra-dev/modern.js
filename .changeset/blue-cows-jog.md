---
'@modern-js/runtime': patch
---

fix: we should inject ssrData & window's data when ssr failed,
fix: 当 ssr 降级时，我们应该注入 ssrData 和 window's data 给 runtimeContext.ssrContext
