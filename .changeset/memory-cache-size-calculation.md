---
'@modern-js/runtime-utils': patch
---

perf: calculate the size of Buffer and string values in the memory cache without `JSON.stringify`, binary files are now counted by their real size, so the default 256 MB cache can hold up to 256 MB of them instead of about 71 MB

perf: 内存缓存计算 Buffer 和字符串大小时不再使用 `JSON.stringify` 序列化，二进制文件按真实大小计算，默认 256 MB 缓存可以存放约 256 MB 的文件，而不是原来的约 71 MB
