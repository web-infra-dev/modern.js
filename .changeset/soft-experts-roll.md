---
'@modern-js/module-tools': minor
---

refactor(module-tools):

1. merge libuild to module tools, add buildConfig.hooks to support load, transform and renderChunk
2. breaking change. remove buildConfig.dts.tsconfigPath, use buildConfig.tsconfig instead, and improve this feature.
3. breaking change. disable buildConfig.transformLodash by default.
4. only use swc transform when enable transformImport, transformLodash or externalHelpers.
5. remove unuse dependecies and improve code quality.
6. support debug mode to print debug logs.
7. fix some css module bugs.
8. support buildConfig.jsx: preserve .
9. support glob input in js and dts generator.

refactor(module-tools):

1. 将 libuild 合入模块工程，添加 buildConfig.hooks，支持 load, transform 和 renderChunk 钩子。
2. 破换性改动: 删除 buildConfig.dts.tsconfigPath,使用 buildConfig.tsconfig,并改进此功能。
3. 破坏性改动: 默认禁用 buildConfig.transformLodash。
4. 只有在开启 transformImport, transformLodash 或 externalHelpers 时才使用 swc 转换。
5. 移除未使用的依赖并提升代码质量。
6. 支持 debug 模式打印调试日志。
7. 修复一些 css module 问题。
8. 支持 buildConfig.jsx: preserve 选项。
9. 支持 glob 模式输入在 js 和 dts 生成器中。
