---
'@modern-js/runtime-utils': patch
---

perf: calculate the size of Buffer and string values in the memory cache without `JSON.stringify`

perf: 内存缓存计算 Buffer 和字符串大小时不再使用 `JSON.stringify` 序列化
