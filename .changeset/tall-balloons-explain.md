---
'@modern-js/server-core': patch
---

fix: Compatible with http-compression, make sure res.end is called before executing the subsequent code
fix: 兼容 http-compression，确保执行后续代码前，res.end 先被调用
