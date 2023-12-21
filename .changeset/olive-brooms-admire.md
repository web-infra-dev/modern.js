---
'@modern-js/module-tools': patch
---

feat(module-tools): add enableTscBuild option, only log error about config and prefer to use declarationDir over outDir when tsc build.
feat(module-tools): 新增 enableTscBuild option, 并且在 tsc build 时对于配置错误仅进行控制台输出，同时优先于 outDir 使用 declarationDir
