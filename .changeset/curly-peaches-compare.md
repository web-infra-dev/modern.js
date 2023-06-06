---
'@modern-js/app-tools': patch
---

fix(app-tools): should not delete internalDir because we need guarantee the dev, build command correct.
fix(app-tools): 不应该在非构建模式下删除 internalDir，因为我们需要保证这些构建模式的入口是正确的
