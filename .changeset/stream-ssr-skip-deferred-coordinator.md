---
'@modern-js/runtime': patch
---

perf: skip HTML tokenizing of streaming SSR output when no deferred resolver script can be inserted, and skip the end tag search inside inline script and style text until a `<` shows up

perf: 流式 SSR 在不会插入任何 deferred resolver 脚本时跳过对输出的 HTML 逐字符解析，并且在内联 script 和 style 文本中遇到 `<` 之前不再进行结束标签匹配
