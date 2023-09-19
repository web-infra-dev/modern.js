---
'@modern-js/module-tools': minor
---

refactor(module-tools):

1. merge libuild to module tools, add buildConfig.hooks to support load, transform and renderChunk
2. support buildConfig.tsconfig, refine the scenarios for custom tsconfig, so replace dts.tsconfigPath with this.
3. disable buildConfig.transformLodash by default:
This optimisation was introduced in version 2.22.0 to reduce code size by modularising lodash import, but it may also cause some compatibility issues, so in version 2.32.0 a new transformLodash configuration has been added to manually disable this optimisation. In this version, this optimisation is turned off by default, and lodash is not processed separately by default.

4. only use swc transform when enable transformImport, transformLodash or externalHelpers.
swc conversion was introduced in version 2.16.0, but the implementation still has some problems, such as format cjs does not have "Annotate the CommonJS export names for ESM import in node", sourceType commonjs support is poor, etc. In this version, swc conversion is no longer used in full, and all kinds of limitations and judgements are removed, and only swc is used as a supplement to some features.

5. remove unuse dependecies and improve code quality.
6. support debug mode to print debug logs.
7. fix some css module bugs.
8. support buildConfig.jsx: preserve .
9. support glob input in js and dts generator.

refactor(module-tools):

1. 将 libuild 合入模块工程，添加 buildConfig.hooks，支持 load, transform 和 renderChunk 钩子。
2. 支持 buildConfig.tsconfig 配置，用来完善自定义 tsconfig 的场景，请用它来替换 dts.tsconfigPath
3. 默认禁用 buildConfig.transformLodash：
此优化是由 2.22.0 版本引入，通过模块化 lodash 的导入从而减小代码体积，但这也可能导致一些兼容性问题，因此在 2.32.0 版本新增了 transformLodash 配置，可以手动关闭此优化。在此版本，默认关闭此优化，默认不对 lodash 作单独的处理。

4. 只有在开启 transformImport, transformLodash 或 externalHelpers 时才使用 swc 转换。
swc 转换是在 2.16.0 版本引入，但实现仍存在一些问题，例如 format cjs 没有 “Annotate the CommonJS export names for ESM import in node”，sourceType commonjs 支持不佳等等，在此版本，不再全量使用 swc 转换，移除各种限制和判断，只使用 swc 作为部分功能的补充。

5. 移除未使用的依赖并提升代码质量。
6. 支持 debug 模式打印调试日志。
7. 修复一些 css module 问题。
8. 支持 buildConfig.jsx: preserve 选项。
9. 支持 glob 模式输入在 js 和 dts 生成器中。
