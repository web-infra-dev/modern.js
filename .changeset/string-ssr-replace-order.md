---
'@modern-js/runtime': patch
---

perf: apply the template replacements before inserting the app html in string SSR

perf: 字符串 SSR 在插入应用 HTML 之前完成模板替换，避免反复扫描和复制完整文档
