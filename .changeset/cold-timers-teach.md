---
'@modern-js/module-tools': patch
---

fix(module-tools): Add namespace when resolve result is false. Build failed in windows because `\empty-stub` is treated as a non-absolute path by esbuild.
fix(module-tools): 当 resovle 的结果是 false 时，添加 namespace，因为在 windows 系统下，`\empty-stub` 会被 esbuild 当成一个非绝对路径导致构建失败。
