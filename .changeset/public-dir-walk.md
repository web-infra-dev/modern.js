---
'@modern-js/app-tools': patch
---

perf: collect public folder routes in linear time without a stat call per file

perf: 以线性时间收集 public 目录路由，不再对每个文件调用 stat
