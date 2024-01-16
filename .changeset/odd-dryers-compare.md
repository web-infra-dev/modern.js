---
'@modern-js/module-tools': patch
---

perf(module-tools): log error detail which may throw by own plugin and complete error stack
perf(module-tools): 补齐错误栈并且打印错误细节，因为这错误可能并不是 esbuild 抛出的，而是我们自己的插件抛出的
