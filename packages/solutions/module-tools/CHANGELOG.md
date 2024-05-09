# @modern-js/module-tools

## 2.49.3

### Patch Changes

- @modern-js/core@2.49.3
- @modern-js/plugin-changeset@2.49.3
- @modern-js/plugin-i18n@2.49.3
- @modern-js/plugin-lint@2.49.3
- @modern-js/plugin@2.49.3
- @modern-js/types@2.49.3
- @modern-js/utils@2.49.3

## 2.49.2

### Patch Changes

- Updated dependencies [10dd841]
  - @modern-js/core@2.49.2
  - @modern-js/plugin-changeset@2.49.2
  - @modern-js/plugin-lint@2.49.2
  - @modern-js/plugin-i18n@2.49.2
  - @modern-js/plugin@2.49.2
  - @modern-js/types@2.49.2
  - @modern-js/utils@2.49.2

## 2.49.1

### Patch Changes

- @modern-js/core@2.49.1
- @modern-js/plugin-changeset@2.49.1
- @modern-js/plugin-i18n@2.49.1
- @modern-js/plugin-lint@2.49.1
- @modern-js/plugin@2.49.1
- @modern-js/types@2.49.1
- @modern-js/utils@2.49.1

## 2.49.0

### Patch Changes

- Updated dependencies [e8c8c5d]
- Updated dependencies [6a543df]
  - @modern-js/types@2.49.0
  - @modern-js/utils@2.49.0
  - @modern-js/core@2.49.0
  - @modern-js/plugin-changeset@2.49.0
  - @modern-js/plugin-i18n@2.49.0
  - @modern-js/plugin-lint@2.49.0
  - @modern-js/plugin@2.49.0

## 2.48.6

### Patch Changes

- @modern-js/core@2.48.6
- @modern-js/plugin-changeset@2.48.6
- @modern-js/plugin-i18n@2.48.6
- @modern-js/plugin-lint@2.48.6
- @modern-js/plugin@2.48.6
- @modern-js/types@2.48.6
- @modern-js/utils@2.48.6

## 2.48.5

### Patch Changes

- 6e15311: fix(module-tools): new matcher to match alias in dts
  fix(module-tools): 新的 matcher 规则以匹配 dts 别名
- 5d135ea: fix: only invoke svgr in load hook
  fix: 只在 load hook 里调用 svgr 逻辑
- Updated dependencies [4ca9f4c]
  - @modern-js/utils@2.48.5
  - @modern-js/core@2.48.5
  - @modern-js/plugin-changeset@2.48.5
  - @modern-js/plugin-i18n@2.48.5
  - @modern-js/plugin-lint@2.48.5
  - @modern-js/plugin@2.48.5
  - @modern-js/types@2.48.5

## 2.48.4

### Patch Changes

- Updated dependencies [7d2d433]
  - @modern-js/utils@2.48.4
  - @modern-js/core@2.48.4
  - @modern-js/plugin-changeset@2.48.4
  - @modern-js/plugin-i18n@2.48.4
  - @modern-js/plugin-lint@2.48.4
  - @modern-js/plugin@2.48.4
  - @modern-js/types@2.48.4

## 2.48.3

### Patch Changes

- @modern-js/core@2.48.3
- @modern-js/plugin-changeset@2.48.3
- @modern-js/plugin-i18n@2.48.3
- @modern-js/plugin-lint@2.48.3
- @modern-js/plugin@2.48.3
- @modern-js/types@2.48.3
- @modern-js/utils@2.48.3

## 2.48.2

### Patch Changes

- @modern-js/core@2.48.2
- @modern-js/plugin-changeset@2.48.2
- @modern-js/plugin-i18n@2.48.2
- @modern-js/plugin-lint@2.48.2
- @modern-js/plugin@2.48.2
- @modern-js/types@2.48.2
- @modern-js/utils@2.48.2

## 2.48.1

### Patch Changes

- b46c84e: fix(module-tools): support tsconfig extends.
  fix(module-tools): 支持解析 tsconfig extends.
- 1129519: fix(module-tools): target es5 not work for mjs chunk
- 4833040: fix(module-tools): new matcher to match alias when exist comment in dynamic import
  fix(module-tools): 新的匹配器以匹配别名即使动态引用里存在注释
- Updated dependencies [8942b90]
- Updated dependencies [ce426f7]
  - @modern-js/utils@2.48.1
  - @modern-js/core@2.48.1
  - @modern-js/plugin-changeset@2.48.1
  - @modern-js/plugin-i18n@2.48.1
  - @modern-js/plugin-lint@2.48.1
  - @modern-js/plugin@2.48.1
  - @modern-js/types@2.48.1

## 2.48.0

### Patch Changes

- d109126: feat(module-tools): add support for custom asset name
  feat(module-tools): 支持自定义资源文件名
- c323a23: feat: separate new & upgrade action from solutions
  feat: 从工程方案中分离 new & upgrade 命令
- Updated dependencies [c323a23]
  - @modern-js/utils@2.48.0
  - @modern-js/core@2.48.0
  - @modern-js/plugin-changeset@2.48.0
  - @modern-js/plugin-i18n@2.48.0
  - @modern-js/plugin-lint@2.48.0
  - @modern-js/plugin@2.48.0
  - @modern-js/types@2.48.0

## 2.47.1

### Patch Changes

- @modern-js/upgrade@2.47.1
- @modern-js/core@2.47.1
- @modern-js/plugin-changeset@2.47.1
- @modern-js/plugin-i18n@2.47.1
- @modern-js/plugin-lint@2.47.1
- @modern-js/new-action@2.47.1
- @modern-js/plugin@2.47.1
- @modern-js/types@2.47.1
- @modern-js/utils@2.47.1

## 2.47.0

### Patch Changes

- f2e3162: fix(module-tools): add js extension when pkg type is module
  fix(module-tools): 当包类型为 module 时，给产物里的相对路径补全文件后缀
- 48e52e3: fix(module-tools): should not remove SVG viewBox attribute

  fix(module-tools): 避免移除 SVG viewBox 属性

- 02da481: feat(module-tools): improve svg typing for SVGR

  feat(module-tools): 优化 svg 类型定义

- Updated dependencies [a5386ab]
- Updated dependencies [3d1effc]
  - @modern-js/utils@2.47.0
  - @modern-js/plugin-lint@2.47.0
  - @modern-js/core@2.47.0
  - @modern-js/new-action@2.47.0
  - @modern-js/plugin-changeset@2.47.0
  - @modern-js/plugin-i18n@2.47.0
  - @modern-js/plugin@2.47.0
  - @modern-js/upgrade@2.47.0
  - @modern-js/types@2.47.0

## 2.46.1

### Patch Changes

- @modern-js/core@2.46.1
- @modern-js/plugin-changeset@2.46.1
- @modern-js/plugin-i18n@2.46.1
- @modern-js/plugin-lint@2.46.1
- @modern-js/new-action@2.46.1
- @modern-js/plugin@2.46.1
- @modern-js/types@2.46.1
- @modern-js/upgrade@2.46.1
- @modern-js/utils@2.46.1

## 2.46.0

### Patch Changes

- 985d1f2: perf(module-tools): skip build js and d.ts when input is empty
  perf(module-tools): 当没有入口时跳过构建 js 和 d.ts 文件
- ac03491: chore(module-tools): upgrade rollup and rollup-plugin-dts version
  chore(module-tools): 更新 rollup 和 rollup-plugin-dts 版本
- 516cc1d: perf(module-tools): log error detail which may throw by own plugin and complete error stack
  perf(module-tools): 补齐错误栈并且打印错误细节，因为这错误可能并不是 esbuild 抛出的，而是我们自己的插件抛出的
- 0b2a379: chore(module-tools): prebundle svgr to reduce install size
  chore(module-tools): 预打包 svgr 以减小安装体积
- 737738c: fix(module-tools): remove function type in transformImport
  fix(module-tools): 移除 transformImport 配置里的函数类型
- d6fa948: chore(module-tools): add babel dep, because @svgr/plugin-jsx depended after prebundle
  chore(module-tools): 新增 babel 依赖，因为预打包后的 @svgr/plugin-jsx 需要这些依赖
- 969455d: chore(module-tools): upgrade ast-grep 0.16.0 to support win32-arm64
- Updated dependencies [494b290]
- Updated dependencies [40ee539]
  - @modern-js/types@2.46.0
  - @modern-js/core@2.46.0
  - @modern-js/utils@2.46.0
  - @modern-js/plugin-changeset@2.46.0
  - @modern-js/plugin-lint@2.46.0
  - @modern-js/plugin-i18n@2.46.0
  - @modern-js/new-action@2.46.0
  - @modern-js/plugin@2.46.0
  - @modern-js/upgrade@2.46.0

## 2.45.0

### Patch Changes

- Updated dependencies [19c8687]
  - @modern-js/types@2.45.0
  - @modern-js/core@2.45.0
  - @modern-js/utils@2.45.0
  - @modern-js/plugin-changeset@2.45.0
  - @modern-js/plugin-i18n@2.45.0
  - @modern-js/plugin-lint@2.45.0
  - @modern-js/new-action@2.45.0
  - @modern-js/plugin@2.45.0
  - @modern-js/upgrade@2.45.0

## 2.44.0

### Patch Changes

- c6a1b97: fix(module-tools): When dealing with dts file alias, explicitly declare the extension when calling matchPath to avoid the problem of not being able to find the module.
  fix(module-tools): 处理类型描述文件别名过程中，在调用 matchPath 时显式声明后缀名，避免无法找到模块的问题
- 52e707b: feat(module-tools): add enableTscBuild option, only log error about config and prefer to use declarationDir over outDir when tsc build.
  feat(module-tools): 新增 enableTscBuild option, 并且在 tsc build 时对于配置错误仅进行控制台输出，同时优先于 outDir 使用 declarationDir
- 6df8c9f: chore(module-tools): bump SVGR to v8.1.0

  chore(module-tools): 升级 SVGR 到 v8.1.0

- bf498d8: feat(module-tools): support svgr with url-loader
  feat(module-tools): 支持 svgr 与 url-loader 一起使用
- Updated dependencies [0ed968c]
- Updated dependencies [56d7f9a]
  - @modern-js/types@2.44.0
  - @modern-js/core@2.44.0
  - @modern-js/utils@2.44.0
  - @modern-js/plugin-changeset@2.44.0
  - @modern-js/plugin-i18n@2.44.0
  - @modern-js/plugin-lint@2.44.0
  - @modern-js/new-action@2.44.0
  - @modern-js/plugin@2.44.0
  - @modern-js/upgrade@2.44.0

## 2.43.0

### Patch Changes

- 83415e3: fix(module-tools): add sourcemap output and remove the useless declaration file when autoExtension takes effect
  fix(module-tools): autoExtension 生效时，添加 sourcemap 输出并移除无用的类型描述文件
- 96f2884: chore: bump swc
  chore: 升级 swc
- a7c6bd8: fix(module-tools): fix logic error in remove dts task
  fix(module-tools): 修复删除 dts 任务的错误逻辑
- 0696cdd: chore(module-tools): simplify logic in rewrite css url
  chore(module-tools): 简化更新 css url 的逻辑
- 11ad678: fix(module-tools): clear .tsbuildinfo before build instead of tsc --clean
  fix(module-tools): 构建前清除 .tsbuildinfo 文件而不是调用 tsc --clean
- Updated dependencies [d959200]
  - @modern-js/types@2.43.0
  - @modern-js/core@2.43.0
  - @modern-js/utils@2.43.0
  - @modern-js/plugin-changeset@2.43.0
  - @modern-js/plugin-i18n@2.43.0
  - @modern-js/plugin-lint@2.43.0
  - @modern-js/new-action@2.43.0
  - @modern-js/plugin@2.43.0
  - @modern-js/upgrade@2.43.0

## 2.42.2

### Patch Changes

- ffeb83b: fix(module-tools): `dev --config <config>` does not work
  fix(module-tools): `dev --config <config>` 未生效
- 4bce612: fix(module-tools): Modify the configuration of isModule when converting umd products.
  fix(module-tools): 修改转换 umd 产物过程中 isModule 的配置
- 923fee7: fix(module-tools): not execa tsc clean in js project
  fix(module-tools): 不在 js 项目执行 tsc clean
- eda89cb: chore(module-tools): upgrade remapping version to 2.2.1
  chore(module-tools): 更新 remapping 版本至 2.2.1
- e4dd353: fix(module-tools): use tsc --clean to clear the tsbuildinfo and d.ts files
  fix(module-tools): 使用 "tsc --clean" 来清理生成的 tsbuildinfo 和类型描述文件
- 82e0af0: fix(module-tools): improve ts references, not change the user tsconfig
  fix(module-tools): 完善对于 ts references 的支持，不再改变用户的 tsconfig
- Updated dependencies [2dfc891]
- Updated dependencies [fa731a7]
  - @modern-js/types@2.42.2
  - @modern-js/new-action@2.42.2
  - @modern-js/upgrade@2.42.2
  - @modern-js/core@2.42.2
  - @modern-js/utils@2.42.2
  - @modern-js/plugin-changeset@2.42.2
  - @modern-js/plugin-i18n@2.42.2
  - @modern-js/plugin-lint@2.42.2
  - @modern-js/plugin@2.42.2

## 2.42.1

### Patch Changes

- fef529c: fix(module-tools): fix ts6369
  fix(module-tools): 修复 ts6369 错误
  - @modern-js/core@2.42.1
  - @modern-js/plugin-changeset@2.42.1
  - @modern-js/plugin-i18n@2.42.1
  - @modern-js/plugin-lint@2.42.1
  - @modern-js/new-action@2.42.1
  - @modern-js/plugin@2.42.1
  - @modern-js/types@2.42.1
  - @modern-js/upgrade@2.42.1
  - @modern-js/utils@2.42.1

## 2.42.0

### Patch Changes

- c2fa7c4: refactor(module-tools): use ast-grep to replace dts alias instead of babel
  refactor(module-tools): 使用 ast-grep 替代 babel 处理 d.ts 文件里的别名
- 5d2f474: fix(module-tools): d.ts.map invalid sources when bundleless
  fix(module-tools): 修复 bundleless 里生成的 d.ts.map 文件中无效的 sources 字段
- 6200cf2: fix(module-tools): add -b param to tsc when user add references to avoid error ts6305
  fix(module-tools): 用户使用 references 时给 tsc 添加 -b 参数来避免 TS6305 错误
- Updated dependencies [b182eb2]
  - @modern-js/new-action@2.42.0
  - @modern-js/upgrade@2.42.0
  - @modern-js/core@2.42.0
  - @modern-js/plugin-changeset@2.42.0
  - @modern-js/plugin-i18n@2.42.0
  - @modern-js/plugin-lint@2.42.0
  - @modern-js/plugin@2.42.0
  - @modern-js/types@2.42.0
  - @modern-js/utils@2.42.0

## 2.41.0

### Minor Changes

- 97c8812: feat(module-tools): support resolveModuleUserConfig to change user config in hooks
  feat(module-tools): 支持 resolveModuleUserConfig 从而能在 hooks 里修改用户配置

### Patch Changes

- 8a3408d: chore(module-tools): remove unuse types in template and reference
  chore(module-tools): 移除模板和引用中的未使用类型
- c4d396a: chore(swc): bump swc and helpers
  chore(swc): 升级 swc 以及 helpers
- ce00f6c: chore: update magic-string version to 0.30
  chore: 更新 magic-string 版本到 0.30
- Updated dependencies [11b99a2]
- Updated dependencies [c4d396a]
  - @modern-js/new-action@2.41.0
  - @modern-js/plugin-changeset@2.41.0
  - @modern-js/plugin-i18n@2.41.0
  - @modern-js/plugin-lint@2.41.0
  - @modern-js/upgrade@2.41.0
  - @modern-js/plugin@2.41.0
  - @modern-js/utils@2.41.0
  - @modern-js/core@2.41.0
  - @modern-js/types@2.41.0

## 2.40.0

### Minor Changes

- 95f15d2: chore: remove ajv schema verification of configuration
  chore: 移除 ajv 对项目配置的校验

### Patch Changes

- 0c1a627: chore(module-tools): remove unuse schema
  chore(module-tools): 移除没有使用的 schema
- 0d36351: chore(module-tools): remove unuse types and reference in types.d.ts
  chore(module-tools): 移除 types.d.ts 无用的类型和引用
- Updated dependencies [95f15d2]
  - @modern-js/utils@2.40.0
  - @modern-js/core@2.40.0
  - @modern-js/plugin-changeset@2.40.0
  - @modern-js/plugin-i18n@2.40.0
  - @modern-js/plugin-lint@2.40.0
  - @modern-js/new-action@2.40.0
  - @modern-js/plugin@2.40.0
  - @modern-js/upgrade@2.40.0
  - @modern-js/types@2.40.0

## 2.39.2

### Patch Changes

- @modern-js/core@2.39.2
- @modern-js/plugin-changeset@2.39.2
- @modern-js/plugin-i18n@2.39.2
- @modern-js/plugin-lint@2.39.2
- @modern-js/new-action@2.39.2
- @modern-js/plugin@2.39.2
- @modern-js/types@2.39.2
- @modern-js/upgrade@2.39.2
- @modern-js/utils@2.39.2

## 2.39.1

### Patch Changes

- @modern-js/new-action@2.39.1
- @modern-js/core@2.39.1
- @modern-js/plugin-changeset@2.39.1
- @modern-js/plugin-i18n@2.39.1
- @modern-js/plugin-lint@2.39.1
- @modern-js/plugin@2.39.1
- @modern-js/types@2.39.1
- @modern-js/upgrade@2.39.1
- @modern-js/utils@2.39.1

## 2.39.0

### Patch Changes

- @modern-js/core@2.39.0
- @modern-js/plugin-changeset@2.39.0
- @modern-js/plugin-i18n@2.39.0
- @modern-js/plugin-lint@2.39.0
- @modern-js/new-action@2.39.0
- @modern-js/plugin@2.39.0
- @modern-js/types@2.39.0
- @modern-js/upgrade@2.39.0
- @modern-js/utils@2.39.0

## 2.38.0

### Minor Changes

- 44fea2c: feat(module-tools): support autoExtension and shims to improve node esm mode
  feat(module-tools): 支持 autoExtension 和 shims 配置以完善 node esm 模式

### Patch Changes

- ac236b3: fix(module-tools): Add namespace when resolve result is false. Build failed in windows because `\empty-stub` is treated as a non-absolute path by esbuild.
  fix(module-tools): 当 resovle 的结果是 false 时，添加 namespace，因为在 windows 系统下，`\empty-stub` 会被 esbuild 当成一个非绝对路径导致构建失败。
- 0b9e483: feat(module-tools): update umd global code
  feat(module-tools): 更新 umd 全局代码
- Updated dependencies [8f43163]
  - @modern-js/new-action@2.38.0
  - @modern-js/upgrade@2.38.0
  - @modern-js/core@2.38.0
  - @modern-js/plugin-changeset@2.38.0
  - @modern-js/plugin-i18n@2.38.0
  - @modern-js/plugin-lint@2.38.0
  - @modern-js/plugin@2.38.0
  - @modern-js/types@2.38.0
  - @modern-js/utils@2.38.0

## 2.37.2

### Patch Changes

- @modern-js/core@2.37.2
- @modern-js/plugin-changeset@2.37.2
- @modern-js/plugin-i18n@2.37.2
- @modern-js/plugin-lint@2.37.2
- @modern-js/new-action@2.37.2
- @modern-js/plugin@2.37.2
- @modern-js/types@2.37.2
- @modern-js/upgrade@2.37.2
- @modern-js/utils@2.37.2

## 2.37.1

### Patch Changes

- @modern-js/core@2.37.1
- @modern-js/plugin-changeset@2.37.1
- @modern-js/plugin-i18n@2.37.1
- @modern-js/plugin-lint@2.37.1
- @modern-js/new-action@2.37.1
- @modern-js/plugin@2.37.1
- @modern-js/types@2.37.1
- @modern-js/upgrade@2.37.1
- @modern-js/utils@2.37.1

## 2.37.0

### Patch Changes

- 194c9a5: fix(module-tools): load empty object instead throw error when js resolve result is false
  fix(module-tools): 当 js resolve 结果为 false 时，加载空对象替代抛出错误
- 0488090: fix(module-tools): catch rebaseUrl error which break the build
  fix(module-tools): 捕获会破坏整个构建的 rebaseUrl 错误
- 822c75e: fix(module-tools): remove baseUrl in tsconfig path plugin, respect custom tsconfig
  fix(module-tools): 移除 tsconfig path 插件里的 baseUrl 配置，尊重自定义 tsconfig 里的配置
- 907dcc8: chore: remove picomatch dep
  chore: 移除 picomatch 依赖
- 70fbaae: fix(module-tools): put terser at the end of renderChunk to ensure minify
  fix(module-tools): 把 terser 放在 renderChunk 的最后阶段来确保全部代码压缩
- 94671a1: fix: alias not working on re-export
  fix: 别名在重导出不生效
- Updated dependencies [383b636]
- Updated dependencies [ce0a14e]
- Updated dependencies [708f248]
  - @modern-js/utils@2.37.0
  - @modern-js/core@2.37.0
  - @modern-js/plugin-changeset@2.37.0
  - @modern-js/plugin-i18n@2.37.0
  - @modern-js/plugin-lint@2.37.0
  - @modern-js/new-action@2.37.0
  - @modern-js/plugin@2.37.0
  - @modern-js/upgrade@2.37.0
  - @modern-js/types@2.37.0

## 2.36.0

### Minor Changes

- 602d1fb: refactor(module-tools):

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
  10. support banner and footer.

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
  10. 支持 banner 和 footer 配置。

### Patch Changes

- 2d8b2df: fix: sourcemap
  fix: 修复 sourcemap
- bbc65b8: feat(module-tools): improve logs in watch mode

  feat(module-tools): 优化 watch 模式下的日志

- d11870b: fix: output don't update in watch mode
  fix: watch 模式下产物不更新
- 71a23a6: chore(module-tools): bump swc-plugins 0.6.4, remove unused deps

  chore(module-tools): 升级 swc-plugins 0.6.4, 移除无用依赖

- a1536f0: fix(module-tools): move init watcher from onStart hook to createCompiler
  fix(module-tools): 将 init watcher 从 onStart 钩子移动到 createCompiler 中
- Updated dependencies [4fbc386]
- Updated dependencies [3473bee]
- Updated dependencies [b98f8aa]
- Updated dependencies [eb602d2]
  - @modern-js/core@2.36.0
  - @modern-js/utils@2.36.0
  - @modern-js/plugin-changeset@2.36.0
  - @modern-js/plugin-lint@2.36.0
  - @modern-js/plugin-i18n@2.36.0
  - @modern-js/new-action@2.36.0
  - @modern-js/plugin@2.36.0
  - @modern-js/upgrade@2.36.0
  - @modern-js/types@2.36.0

## 2.35.1

### Patch Changes

- ce24aad: feat: bump postcss-nesting v12 to support latest CSS nesting syntax

  feat: 升级 postcss-nesting v12，支持最新的 CSS nesting 语法

- Updated dependencies [ea3fe18]
- Updated dependencies [a45cc5b]
- Updated dependencies [14f95cf]
- Updated dependencies [4b8cdd3]
- Updated dependencies [9dd3151]
- Updated dependencies [4980480]
- Updated dependencies [14b0906]
- Updated dependencies [843cb2c]
- Updated dependencies [6a1d46e]
  - @modern-js/utils@2.35.1
  - @modern-js/libuild-plugin-swc@2.35.1
  - @modern-js/plugin@2.35.1
  - @modern-js/core@2.35.1
  - @modern-js/plugin-changeset@2.35.1
  - @modern-js/plugin-i18n@2.35.1
  - @modern-js/plugin-lint@2.35.1
  - @modern-js/new-action@2.35.1
  - @modern-js/upgrade@2.35.1
  - @modern-js/libuild-plugin-svgr@2.35.1
  - @modern-js/libuild@2.35.1
  - @modern-js/types@2.35.1

## 2.35.0

### Patch Changes

- 15b834f: feat(CLI): print gradient text for initial log

  feat(CLI): 输出 initial log 时使用渐变色文字

- Updated dependencies [15b834f]
- Updated dependencies [28128ca]
  - @modern-js/utils@2.35.0
  - @modern-js/core@2.35.0
  - @modern-js/libuild@2.35.0
  - @modern-js/plugin-changeset@2.35.0
  - @modern-js/plugin-i18n@2.35.0
  - @modern-js/plugin-lint@2.35.0
  - @modern-js/new-action@2.35.0
  - @modern-js/plugin@2.35.0
  - @modern-js/upgrade@2.35.0
  - @modern-js/libuild-plugin-svgr@2.35.0
  - @modern-js/libuild-plugin-swc@2.35.0
  - @modern-js/types@2.35.0

## 2.34.0

### Patch Changes

- 76af015: fix(module-tools): failed to run pre and gen-release-note command

  fix(module-tools): 修复无法执行 pre 和 gen-release-note 命令的问题

- Updated dependencies [a77b82a]
- Updated dependencies [c8b448b]
  - @modern-js/utils@2.34.0
  - @modern-js/core@2.34.0
  - @modern-js/plugin-changeset@2.34.0
  - @modern-js/plugin-i18n@2.34.0
  - @modern-js/plugin-lint@2.34.0
  - @modern-js/new-action@2.34.0
  - @modern-js/plugin@2.34.0
  - @modern-js/upgrade@2.34.0
  - @modern-js/libuild-plugin-svgr@2.34.0
  - @modern-js/libuild@2.34.0
  - @modern-js/libuild-plugin-swc@2.34.0
  - @modern-js/types@2.34.0

## 2.33.1

### Patch Changes

- c38570e: feat: new and upgrade command support --no-need-install params
- 7ad82bd: fix: add svg files to input when enable svgr
  fix: 当启用 svgr 时添加 svg 文件到输入
  - @modern-js/core@2.33.1
  - @modern-js/plugin-changeset@2.33.1
  - @modern-js/plugin-i18n@2.33.1
  - @modern-js/plugin-lint@2.33.1
  - @modern-js/new-action@2.33.1
  - @modern-js/libuild@2.33.1
  - @modern-js/libuild-plugin-svgr@2.33.1
  - @modern-js/libuild-plugin-swc@2.33.1
  - @modern-js/plugin@2.33.1
  - @modern-js/types@2.33.1
  - @modern-js/upgrade@2.33.1
  - @modern-js/utils@2.33.1

## 2.33.0

### Patch Changes

- Updated dependencies [ecb9276]
- Updated dependencies [fd82137]
- Updated dependencies [bc1f8da]
  - @modern-js/core@2.33.0
  - @modern-js/utils@2.33.0
  - @modern-js/plugin-changeset@2.33.0
  - @modern-js/plugin-lint@2.33.0
  - @modern-js/new-action@2.33.0
  - @modern-js/plugin-i18n@2.33.0
  - @modern-js/plugin@2.33.0
  - @modern-js/upgrade@2.33.0
  - @modern-js/libuild-plugin-svgr@2.33.0
  - @modern-js/libuild@2.33.0
  - @modern-js/libuild-plugin-swc@2.33.0
  - @modern-js/types@2.33.0

## 2.32.1

### Patch Changes

- Updated dependencies [6fc113b]
- Updated dependencies [90e053a]
  - @modern-js/libuild-plugin-swc@2.32.1
  - @modern-js/types@2.32.1
  - @modern-js/core@2.32.1
  - @modern-js/utils@2.32.1
  - @modern-js/plugin-changeset@2.32.1
  - @modern-js/plugin-i18n@2.32.1
  - @modern-js/plugin-lint@2.32.1
  - @modern-js/new-action@2.32.1
  - @modern-js/libuild@2.32.1
  - @modern-js/libuild-plugin-svgr@2.32.1
  - @modern-js/plugin@2.32.1
  - @modern-js/upgrade@2.32.1

## 2.32.0

### Minor Changes

- 8d22b87: feat: add transformLodash option to enable or disable lodash feature
  feat: 添加 transformLodash 选项控制 lodash 功能的开启或关闭

### Patch Changes

- Updated dependencies [e5a3fb4]
- Updated dependencies [6076166]
- Updated dependencies [a030aff]
- Updated dependencies [8d22b87]
- Updated dependencies [4323e68]
- Updated dependencies [3c91100]
- Updated dependencies [5255eba]
  - @modern-js/utils@2.32.0
  - @modern-js/plugin@2.32.0
  - @modern-js/types@2.32.0
  - @modern-js/core@2.32.0
  - @modern-js/libuild-plugin-swc@2.32.0
  - @modern-js/plugin-changeset@2.32.0
  - @modern-js/plugin-i18n@2.32.0
  - @modern-js/plugin-lint@2.32.0
  - @modern-js/new-action@2.32.0
  - @modern-js/upgrade@2.32.0
  - @modern-js/libuild-plugin-svgr@2.32.0
  - @modern-js/libuild@2.32.0

## 2.31.2

### Patch Changes

- Updated dependencies [15d30abdc66]
  - @modern-js/utils@2.31.2
  - @modern-js/core@2.31.2
  - @modern-js/plugin-changeset@2.31.2
  - @modern-js/plugin-i18n@2.31.2
  - @modern-js/plugin-lint@2.31.2
  - @modern-js/new-action@2.31.2
  - @modern-js/plugin@2.31.2
  - @modern-js/upgrade@2.31.2
  - @modern-js/libuild-plugin-svgr@2.31.2
  - @modern-js/libuild@2.31.2
  - @modern-js/libuild-plugin-swc@2.31.2
  - @modern-js/types@2.31.2

## 2.31.1

### Patch Changes

- @modern-js/core@2.31.1
- @modern-js/plugin-changeset@2.31.1
- @modern-js/plugin-i18n@2.31.1
- @modern-js/plugin-lint@2.31.1
- @modern-js/new-action@2.31.1
- @modern-js/libuild@2.31.1
- @modern-js/libuild-plugin-svgr@2.31.1
- @modern-js/libuild-plugin-swc@2.31.1
- @modern-js/plugin@2.31.1
- @modern-js/types@2.31.1
- @modern-js/upgrade@2.31.1
- @modern-js/utils@2.31.1

## 2.31.0

### Patch Changes

- 4c03d9a: fix(core): remove testing config type and schema

  fix(core): 移除 testing 配置类型和 schema

- 1882366: chore(deps): bump build dependencies

  chore(deps): 升级构建相关依赖

- Updated dependencies [2361ce8]
- Updated dependencies [4c03d9a]
- Updated dependencies [1882366]
  - @modern-js/core@2.31.0
  - @modern-js/libuild@2.31.0
  - @modern-js/utils@2.31.0
  - @modern-js/plugin-changeset@2.31.0
  - @modern-js/plugin-lint@2.31.0
  - @modern-js/libuild-plugin-svgr@2.31.0
  - @modern-js/libuild-plugin-swc@2.31.0
  - @modern-js/plugin-i18n@2.31.0
  - @modern-js/new-action@2.31.0
  - @modern-js/plugin@2.31.0
  - @modern-js/upgrade@2.31.0
  - @modern-js/types@2.31.0

## 2.30.0

### Patch Changes

- c03be09: feat(CLI): print solution name and version to terminal

  feat(CLI): 在控制台输出 solution 的名称和版本

- Updated dependencies [05fa4d5]
- Updated dependencies [c03be09]
- Updated dependencies [7cb7b24]
- Updated dependencies [3e67a4e]
  - @modern-js/libuild@2.30.0
  - @modern-js/core@2.30.0
  - @modern-js/libuild-plugin-svgr@2.30.0
  - @modern-js/libuild-plugin-swc@2.30.0
  - @modern-js/utils@2.30.0
  - @modern-js/plugin-changeset@2.30.0
  - @modern-js/plugin-lint@2.30.0
  - @modern-js/plugin-i18n@2.30.0
  - @modern-js/new-action@2.30.0
  - @modern-js/plugin@2.30.0
  - @modern-js/upgrade@2.30.0

## 2.29.0

### Patch Changes

- 6993eb6: fix(module-tools): set platform to browser when build umd output

  fix(module-tools): 构建 umd 时默认将 platform 设置为 browser

- 0f680ec: chore(deps): bump swc-plugins 0.5.5 and libuild 0.14.3

  chore(deps): 升级 swc-plugins 0.5.5 和 libuild 0.14.3

- Updated dependencies [e6b5355]
- Updated dependencies [93db783]
- Updated dependencies [cba7675]
- Updated dependencies [99052ea]
- Updated dependencies [1d71d2e]
  - @modern-js/utils@2.29.0
  - @modern-js/core@2.29.0
  - @modern-js/plugin-changeset@2.29.0
  - @modern-js/plugin-i18n@2.29.0
  - @modern-js/plugin-lint@2.29.0
  - @modern-js/new-action@2.29.0
  - @modern-js/plugin@2.29.0
  - @modern-js/upgrade@2.29.0

## 2.28.0

### Minor Changes

- 118c1c0: chore: upgrade libuild and libuild plugin version to 0.14.1
  chore: 升级 libuild 和 libuild 插件的版本到 0.14.1

### Patch Changes

- 3092f1f: fix(module-tools): limit concurrency count
  fix(module-tools): 限制并行的数量
- b7a8c43: fix(module-tools): fix input filter files
  fix(module-tools): 修复 input 过滤文件的问题
- d3e52e4: chore(CI): update build config to improve vitest CI perf

  chore(CI): 更新构建配置来提升 vitest CI 性能

- Updated dependencies [00b58a7]
- Updated dependencies [d3e52e4]
  - @modern-js/utils@2.28.0
  - @modern-js/upgrade@2.28.0
  - @modern-js/core@2.28.0
  - @modern-js/plugin-changeset@2.28.0
  - @modern-js/plugin-i18n@2.28.0
  - @modern-js/plugin-lint@2.28.0
  - @modern-js/new-action@2.28.0
  - @modern-js/plugin@2.28.0

## 2.27.0

### Patch Changes

- Updated dependencies [91d14b8]
- Updated dependencies [8322a51]
- Updated dependencies [6d7104d]
  - @modern-js/utils@2.27.0
  - @modern-js/new-action@2.27.0
  - @modern-js/plugin-i18n@2.27.0
  - @modern-js/plugin-lint@2.27.0
  - @modern-js/core@2.27.0
  - @modern-js/plugin-changeset@2.27.0
  - @modern-js/plugin@2.27.0
  - @modern-js/upgrade@2.27.0

## 2.26.0

### Patch Changes

- 54c484c: fix(module-tools): support i18n for checkConfig warning message

  fix(module-tools): checkConfig 的 warning 日志支持 i18n

- cc2e3b7: feat(module-tools): apply PostCSS plugins according to the target

  feat(module-tools): 基于 target 启用 PostCSS 插件

- Updated dependencies [ad7139b]
- Updated dependencies [fbcac63]
  - @modern-js/upgrade@2.26.0
  - @modern-js/core@2.26.0
  - @modern-js/new-action@2.26.0
  - @modern-js/plugin-changeset@2.26.0
  - @modern-js/plugin-i18n@2.26.0
  - @modern-js/plugin-lint@2.26.0
  - @modern-js/plugin@2.26.0
  - @modern-js/utils@2.26.0

## 2.25.2

### Patch Changes

- a2a5bcd: fix(module-tools): fix error in concurrent copy when generate dts files.
  fix(module-tools): 修复在生成类型文件的时候并发复制产生的错误
- Updated dependencies [63d8247]
- Updated dependencies [6651684]
- Updated dependencies [272646c]
- Updated dependencies [358ed24]
  - @modern-js/utils@2.25.2
  - @modern-js/core@2.25.2
  - @modern-js/plugin-changeset@2.25.2
  - @modern-js/plugin-i18n@2.25.2
  - @modern-js/plugin-lint@2.25.2
  - @modern-js/new-action@2.25.2
  - @modern-js/plugin@2.25.2
  - @modern-js/upgrade@2.25.2

## 2.25.1

### Patch Changes

- 273e3cd: chore: update libuild version to 0.13.2
  chore: 升级 libuild 版本至 0.13.2
- Updated dependencies [9f78d0c]
  - @modern-js/utils@2.25.1
  - @modern-js/core@2.25.1
  - @modern-js/plugin-changeset@2.25.1
  - @modern-js/plugin-i18n@2.25.1
  - @modern-js/plugin-lint@2.25.1
  - @modern-js/new-action@2.25.1
  - @modern-js/plugin@2.25.1
  - @modern-js/upgrade@2.25.1

## 2.25.0

### Patch Changes

- 9aa2c25: feat: add named exports for all solutions

  feat: 为各个 solutions 添加 named 导出

- d287b7f: feat: new and upgrade command support custom config file

  feat: new 和 upgrade 命令支持自定义配置文件路径

- Updated dependencies [af97415]
- Updated dependencies [10572f3]
- Updated dependencies [2edd844]
- Updated dependencies [5732c6a]
- Updated dependencies [4c4c0ad]
- Updated dependencies [d287b7f]
  - @modern-js/core@2.25.0
  - @modern-js/plugin-changeset@2.25.0
  - @modern-js/new-action@2.25.0
  - @modern-js/utils@2.25.0
  - @modern-js/plugin-lint@2.25.0
  - @modern-js/plugin-i18n@2.25.0
  - @modern-js/plugin@2.25.0
  - @modern-js/upgrade@2.25.0

## 2.24.0

### Patch Changes

- 53ba418: chore: upgrade libuild and libuild plugins version to 0.13.1
  chore: 升级 libuild 和 libuild 插件版本到 0.13.1
- 3b82675: feat: Auto delete build artifacts by checking if outdir is project root path
  feat: 根据 outDir 是否是项目根目录决定是否自动删除产物目录
- 7073297: fix: close declarationMap when bundle dts
  fix: 打包 dts 时关闭 declarationMap
- Updated dependencies [c882fbd]
- Updated dependencies [4a82c3b]
  - @modern-js/utils@2.24.0
  - @modern-js/core@2.24.0
  - @modern-js/plugin-changeset@2.24.0
  - @modern-js/plugin-i18n@2.24.0
  - @modern-js/plugin-lint@2.24.0
  - @modern-js/new-action@2.24.0
  - @modern-js/plugin@2.24.0
  - @modern-js/upgrade@2.24.0

## 2.23.1

### Patch Changes

- Updated dependencies [f08bbfc]
- Updated dependencies [a6b313a]
- Updated dependencies [8f2cab0]
  - @modern-js/utils@2.23.1
  - @modern-js/core@2.23.1
  - @modern-js/plugin-changeset@2.23.1
  - @modern-js/plugin-i18n@2.23.1
  - @modern-js/plugin-lint@2.23.1
  - @modern-js/new-action@2.23.1
  - @modern-js/plugin@2.23.1
  - @modern-js/upgrade@2.23.1

## 2.23.0

### Minor Changes

- 21b7f86: feat: support dts.respectExternal
  feat: 支持 dts.respectExternal 配置

### Patch Changes

- 7e6fb5f: chore: publishConfig add provenance config

  chore: publishConfig 增加 provenance 配置

- d1ef55f: fix: config useDefineForClassFields by user tsconfig.json
  fix: 根据用户 tsconfig.json 配置,设置 useDefineForClassFields
- Updated dependencies [7e6fb5f]
- Updated dependencies [a7a7ad7]
- Updated dependencies [b593040]
- Updated dependencies [e2245c3]
- Updated dependencies [6dec7c2]
- Updated dependencies [c3216b5]
  - @modern-js/plugin-changeset@2.23.0
  - @modern-js/new-action@2.23.0
  - @modern-js/plugin-i18n@2.23.0
  - @modern-js/plugin-lint@2.23.0
  - @modern-js/upgrade@2.23.0
  - @modern-js/plugin@2.23.0
  - @modern-js/utils@2.23.0
  - @modern-js/core@2.23.0

## 2.22.1

### Patch Changes

- Updated dependencies [e2848a2]
- Updated dependencies [a2dd693]
- Updated dependencies [b904b3a]
- Updated dependencies [d4045ed]
- Updated dependencies [1f02cd2]
  - @modern-js/utils@2.22.1
  - @modern-js/plugin-changeset@2.22.1
  - @modern-js/core@2.22.1
  - @modern-js/plugin-i18n@2.22.1
  - @modern-js/plugin-lint@2.22.1
  - @modern-js/new-action@2.22.1
  - @modern-js/plugin@2.22.1
  - @modern-js/upgrade@2.22.1

## 2.22.0

### Patch Changes

- d19dc11: chore(module-tools): bump rollup v3

  chore(module-tools): 升级 rollup v3

- c890980: feat: add swc transform content and fix build logic when disable swc-transform
  feat: 添加 swc transform 相关文档内容,并且修复禁用 swc-transform 时候的构建逻辑
- 4b7488c: chore(deps): bump libuild v0.12.4 and swc-plugins v0.3.5

  chore(deps): 升级 libuild v0.12.4 和 swc-plugins v0.3.5

- Updated dependencies [3d48836]
- Updated dependencies [7d1b96e]
- Updated dependencies [5050e8e]
- Updated dependencies [27618e4]
- Updated dependencies [b647c68]
  - @modern-js/utils@2.22.0
  - @modern-js/plugin-changeset@2.22.0
  - @modern-js/core@2.22.0
  - @modern-js/new-action@2.22.0
  - @modern-js/upgrade@2.22.0
  - @modern-js/plugin-i18n@2.22.0
  - @modern-js/plugin-lint@2.22.0
  - @modern-js/plugin@2.22.0

## 2.21.1

### Patch Changes

- @modern-js/core@2.21.1
- @modern-js/plugin-changeset@2.21.1
- @modern-js/plugin-i18n@2.21.1
- @modern-js/plugin-lint@2.21.1
- @modern-js/new-action@2.21.1
- @modern-js/plugin@2.21.1
- @modern-js/upgrade@2.21.1
- @modern-js/utils@2.21.1

## 2.21.0

### Patch Changes

- df43559: fix(core): toolsType is overridden when install multiple solutions

  fix(core): 修复安装多个 solutions 时 toolsType 被覆盖的问题

- 26dcf3a: chore: bump typescript to v5 in devDependencies

  chore: 升级 devDependencies 中的 typescript 版本到 v5

- ad78387: chore(deps): bump babel-related dependencies to latest version

  chore(deps): 升级 babel 相关依赖到最新版本

- Updated dependencies [df43559]
- Updated dependencies [e81eeaf]
- Updated dependencies [26dcf3a]
- Updated dependencies [056627f]
- Updated dependencies [de8f73f]
- Updated dependencies [0fc15ca]
- Updated dependencies [43b4e83]
- Updated dependencies [ad78387]
  - @modern-js/core@2.21.0
  - @modern-js/utils@2.21.0
  - @modern-js/plugin-changeset@2.21.0
  - @modern-js/new-action@2.21.0
  - @modern-js/plugin-i18n@2.21.0
  - @modern-js/plugin-lint@2.21.0
  - @modern-js/upgrade@2.21.0
  - @modern-js/plugin@2.21.0

## 2.20.0

### Patch Changes

- 6b9d90a: chore: remove @babel/runtime. add @swc/helper and enable `externalHelper` config.
  chore: 移除 @babel/runtime 依赖. 增加 @swc/helpers 依赖并且开启 `externalHelpers` 配置
- 6b9d90a: feat: update internal build configs
  feat: 更新内部构建配置
- Updated dependencies [3c4e0a5]
- Updated dependencies [6b9d90a]
- Updated dependencies [4b03d17]
- Updated dependencies [6289d31]
  - @modern-js/utils@2.20.0
  - @modern-js/plugin-changeset@2.20.0
  - @modern-js/new-action@2.20.0
  - @modern-js/plugin-i18n@2.20.0
  - @modern-js/plugin-lint@2.20.0
  - @modern-js/upgrade@2.20.0
  - @modern-js/plugin@2.20.0
  - @modern-js/core@2.20.0

## 2.19.1

### Patch Changes

- @modern-js/core@2.19.1
- @modern-js/plugin-changeset@2.19.1
- @modern-js/plugin-i18n@2.19.1
- @modern-js/plugin-lint@2.19.1
- @modern-js/new-action@2.19.1
- @modern-js/plugin@2.19.1
- @modern-js/upgrade@2.19.1
- @modern-js/utils@2.19.1

## 2.19.0

### Patch Changes

- Updated dependencies [1134fe2]
  - @modern-js/utils@2.19.0
  - @modern-js/core@2.19.0
  - @modern-js/plugin-changeset@2.19.0
  - @modern-js/plugin-i18n@2.19.0
  - @modern-js/plugin-lint@2.19.0
  - @modern-js/new-action@2.19.0
  - @modern-js/plugin@2.19.0
  - @modern-js/upgrade@2.19.0

## 2.18.1

### Patch Changes

- cdc9db1: fix(module-tools, plugin-tailwindcss): fix `style.tailwindcss` config name and merge logic
  fix(module-tools, plugin-tailwindcss): 修复 `style.tailwindcss` 错误的配置名和合并逻辑
- b161968: chore: fix libuild version
  chore: 锁定 libuild 版本号
- Updated dependencies [21c87bf]
- Updated dependencies [bc61dab]
  - @modern-js/new-action@2.18.1
  - @modern-js/upgrade@2.18.1
  - @modern-js/core@2.18.1
  - @modern-js/plugin-changeset@2.18.1
  - @modern-js/plugin-i18n@2.18.1
  - @modern-js/plugin-lint@2.18.1
  - @modern-js/plugin@2.18.1
  - @modern-js/utils@2.18.1

## 2.18.0

### Patch Changes

- f65d3e8: chore: update libuild version
  chore: 更新 libuild 版本
  - @modern-js/core@2.18.0
  - @modern-js/plugin-changeset@2.18.0
  - @modern-js/plugin-i18n@2.18.0
  - @modern-js/plugin-lint@2.18.0
  - @modern-js/new-action@2.18.0
  - @modern-js/plugin@2.18.0
  - @modern-js/upgrade@2.18.0
  - @modern-js/utils@2.18.0

## 2.17.1

### Patch Changes

- @modern-js/core@2.17.1
- @modern-js/plugin-changeset@2.17.1
- @modern-js/plugin-i18n@2.17.1
- @modern-js/plugin-lint@2.17.1
- @modern-js/new-action@2.17.1
- @modern-js/plugin@2.17.1
- @modern-js/upgrade@2.17.1
- @modern-js/utils@2.17.1

## 2.17.0

### Patch Changes

- @modern-js/core@2.17.0
- @modern-js/plugin-changeset@2.17.0
- @modern-js/plugin-i18n@2.17.0
- @modern-js/plugin-lint@2.17.0
- @modern-js/new-action@2.17.0
- @modern-js/plugin@2.17.0
- @modern-js/upgrade@2.17.0
- @modern-js/utils@2.17.0

## 2.16.0

### Minor Changes

- b06f571: feat(module-tools): Replace esbuild-transform with swc-transform for the underlying build, reducing the size of the build product. Added `externalHelpers`, `transformImport` and `disbaleSwcTransform` configurations.
  feat(module-tools): 底层构建使用 swc-transform 替换 esbuild-transform, 减少构建产物体积.新增 `externalHelpers`、`transformImport` 和 `disbaleSwcTransform` 配置.

### Patch Changes

- acc0a00: fix: upgrade libuild version to support tailwind in watch mode
  fix: 更新 libuild 版本以支持 tailwindcss 在 watch 模式下生效
- fd4a8a6: chore(deps): bump postcss-custom-properties to v13.1.5

  chore(deps): 升级 postcss-custom-properties 到 v13.1.5

- 4e876ab: chore: package.json include the monorepo-relative directory

  chore: 在 package.json 中声明 monorepo 的子路径

- 355d36e: feat: adjust create tools and new command option order

  feat: 调整 create 工具及 new 命令 option 操作顺序

- b06f571: chore: update libuild and libuild plugins version to 0.12.0
  chore: 更新 libuild 和 libuild 插件的版本到 0.12.0
- Updated dependencies [5954330]
- Updated dependencies [7596520]
- Updated dependencies [4e876ab]
- Updated dependencies [6d5219e]
  - @modern-js/utils@2.16.0
  - @modern-js/plugin@2.16.0
  - @modern-js/plugin-changeset@2.16.0
  - @modern-js/new-action@2.16.0
  - @modern-js/plugin-i18n@2.16.0
  - @modern-js/plugin-lint@2.16.0
  - @modern-js/upgrade@2.16.0
  - @modern-js/core@2.16.0

## 2.15.0

### Patch Changes

- @modern-js/core@2.15.0
- @modern-js/plugin-changeset@2.15.0
- @modern-js/plugin-i18n@2.15.0
- @modern-js/plugin-lint@2.15.0
- @modern-js/new-action@2.15.0
- @modern-js/plugin@2.15.0
- @modern-js/upgrade@2.15.0
- @modern-js/utils@2.15.0

## 2.14.0

### Minor Changes

- f08f3ab: feat: add esbuildOptions to support that change esbuild options directly
  feat: 新增 esbuildOptions 配置支持直接修改 esbuild 最终配置

### Patch Changes

- 432ac8b: chore(cli): improve commands descriptions

  chore(cli): 优化命令的描述文案

- Updated dependencies [4779152]
- Updated dependencies [9321bef]
- Updated dependencies [9b45c58]
- Updated dependencies [52d0cb1]
- Updated dependencies [60a81d0]
- Updated dependencies [432ac8b]
- Updated dependencies [dacef96]
- Updated dependencies [16399fd]
  - @modern-js/utils@2.14.0
  - @modern-js/plugin-lint@2.14.0
  - @modern-js/core@2.14.0
  - @modern-js/plugin-changeset@2.14.0
  - @modern-js/plugin-i18n@2.14.0
  - @modern-js/new-action@2.14.0
  - @modern-js/upgrade@2.14.0
  - @modern-js/plugin@2.14.0

## 2.13.4

### Patch Changes

- @modern-js/core@2.13.4
- @modern-js/plugin-changeset@2.13.4
- @modern-js/plugin-i18n@2.13.4
- @modern-js/plugin-lint@2.13.4
- @modern-js/new-action@2.13.4
- @modern-js/plugin@2.13.4
- @modern-js/upgrade@2.13.4
- @modern-js/utils@2.13.4

## 2.13.3

### Patch Changes

- c20e67d: fix(module-tools): missing postcss dependency

  fix(module-tools): 修复缺少 postcss 依赖的问题

  - @modern-js/core@2.13.3
  - @modern-js/plugin-changeset@2.13.3
  - @modern-js/plugin-i18n@2.13.3
  - @modern-js/plugin-lint@2.13.3
  - @modern-js/new-action@2.13.3
  - @modern-js/plugin@2.13.3
  - @modern-js/upgrade@2.13.3
  - @modern-js/utils@2.13.3

## 2.13.2

### Patch Changes

- Updated dependencies [106ac07]
- Updated dependencies [7f4fd56]
  - @modern-js/core@2.13.2
  - @modern-js/plugin-changeset@2.13.2
  - @modern-js/plugin-lint@2.13.2
  - @modern-js/plugin-i18n@2.13.2
  - @modern-js/new-action@2.13.2
  - @modern-js/plugin@2.13.2
  - @modern-js/upgrade@2.13.2
  - @modern-js/utils@2.13.2

## 2.13.1

### Patch Changes

- Updated dependencies [ab79a7b]
  - @modern-js/core@2.13.1
  - @modern-js/plugin-changeset@2.13.1
  - @modern-js/plugin-lint@2.13.1
  - @modern-js/plugin-i18n@2.13.1
  - @modern-js/new-action@2.13.1
  - @modern-js/plugin@2.13.1
  - @modern-js/upgrade@2.13.1
  - @modern-js/utils@2.13.1

## 2.13.0

### Patch Changes

- 034f36b: feat: set the default language of CLI to English

  feat: 将命令行的默认语言设置为英文

- 88faab3: feat: use `declarationDir` instead of `outDir`
  feat: 使用 `declarationDir` 替换 `outDir`
- 034f36b: fix(upgrade): i18n of upgrade command not work

  fix(upgrade): 修复 upgrade 命令的 i18n 配置不生效的问题

- 79bc089: fix(module-tools): fix noClear option not work
  fix(module-tools): 修复 noClear 配置不生效
- Updated dependencies [e9b1656]
- Updated dependencies [e91ec97]
- Updated dependencies [034f36b]
- Updated dependencies [78431f4]
- Updated dependencies [034f36b]
  - @modern-js/core@2.13.0
  - @modern-js/plugin-changeset@2.13.0
  - @modern-js/plugin-i18n@2.13.0
  - @modern-js/upgrade@2.13.0
  - @modern-js/plugin@2.13.0
  - @modern-js/plugin-lint@2.13.0
  - @modern-js/new-action@2.13.0
  - @modern-js/utils@2.13.0

## 2.12.0

### Minor Changes

- 1cdb379: feat: support redirect config
  feat: 支持 redirect 配置

### Patch Changes

- af705fa: fix: update libuild version to fix windows resolve path
  fix: 升级 libuild 版本来修复 windows 机器对于路径的解析
- 0baa168: chore: upgrade libuild version to ~0.11.8
  chore: 更新 libuild 版本到 ~0.11.8
- 3936535: fix(module-tools): fix input glob path
  fix(module-tools): 修复 input glob 路径的问题
- 8a3fbbd: fix(module-tools): fix warning content
  fix(module-tools): 修复警告内容
- 8bc2d12: fix(module-tools): fix noClear option not work
  fix(module-tools): 修复 noClear 配置不生效
- Updated dependencies [c2ca6c8]
- Updated dependencies [6d86e34]
  - @modern-js/utils@2.12.0
  - @modern-js/core@2.12.0
  - @modern-js/plugin-changeset@2.12.0
  - @modern-js/plugin-i18n@2.12.0
  - @modern-js/plugin-lint@2.12.0
  - @modern-js/new-action@2.12.0
  - @modern-js/upgrade@2.12.0
  - @modern-js/plugin@2.12.0

## 2.11.0

### Minor Changes

- f1b2629: feat: add `dts.abortOnError` config
  feat: 添加 `dts.abortOnError` 配置

### Patch Changes

- aa0a312: chore(module-tools): pretty the log format

  chore(module-tools): 优化日志格式

- 6118636: fix(module-tools, module-tools-docs): fix svgr usage
  fix(module-tools, module-tools-docs): 修复 svgr 的使用
- Updated dependencies [cfb058f]
- Updated dependencies [0bd018b]
- Updated dependencies [5d624fd]
- Updated dependencies [e2466a1]
- Updated dependencies [58faba2]
- Updated dependencies [02bb383]
- Updated dependencies [381a3b9]
- Updated dependencies [7a60f10]
- Updated dependencies [7178795]
- Updated dependencies [274b2e5]
- Updated dependencies [b9e1c54]
  - @modern-js/utils@2.11.0
  - @modern-js/core@2.11.0
  - @modern-js/plugin-lint@2.11.0
  - @modern-js/plugin-changeset@2.11.0
  - @modern-js/plugin-i18n@2.11.0
  - @modern-js/new-action@2.11.0
  - @modern-js/upgrade@2.11.0
  - @modern-js/plugin@2.11.0

## 2.10.0

### Patch Changes

- 0da32d0: chore: upgrade jest and puppeteer
  chore: 升级 jest 和 puppeteer 到 latest
- Updated dependencies [0da32d0]
- Updated dependencies [d3f0642]
- Updated dependencies [a16b9b0]
- Updated dependencies [0d9962b]
- Updated dependencies [fbefa7e]
- Updated dependencies [4d54233]
- Updated dependencies [6db4864]
  - @modern-js/plugin-changeset@2.10.0
  - @modern-js/new-action@2.10.0
  - @modern-js/plugin-i18n@2.10.0
  - @modern-js/plugin-lint@2.10.0
  - @modern-js/upgrade@2.10.0
  - @modern-js/plugin@2.10.0
  - @modern-js/utils@2.10.0
  - @modern-js/core@2.10.0

## 2.9.0

### Patch Changes

- Updated dependencies [88328d914b]
- Updated dependencies [dd56401486]
  - @modern-js/core@2.9.0
  - @modern-js/plugin-changeset@2.9.0
  - @modern-js/plugin-lint@2.9.0
  - @modern-js/new-action@2.9.0
  - @modern-js/plugin-i18n@2.9.0
  - @modern-js/plugin@2.9.0
  - @modern-js/upgrade@2.9.0
  - @modern-js/utils@2.9.0

## 2.8.0

### Patch Changes

- adf68ec3ed: fix: ignore some tsconfig compileOptions
  fix: 忽略一些 tsconfig 的 compileOptions 配置
- Updated dependencies [1e7c2c5a65]
- Updated dependencies [1104a9f18b]
- Updated dependencies [45d726979b]
- Updated dependencies [1f6ca2c7fb]
  - @modern-js/plugin-changeset@2.8.0
  - @modern-js/utils@2.8.0
  - @modern-js/core@2.8.0
  - @modern-js/plugin-i18n@2.8.0
  - @modern-js/plugin-lint@2.8.0
  - @modern-js/new-action@2.8.0
  - @modern-js/upgrade@2.8.0
  - @modern-js/plugin@2.8.0

## 2.7.0

### Patch Changes

- eccfe877b5: fix: add watch mode to copy
  fix: 为 copy 功能补充 watch 逻辑
- 7fff9020e1: chore: make file naming consistent

  chore: 统一文件命名为小驼峰格式

- 1eea234fdd: chore: make test files naming consistent

  chore: 统一测试文件命名为小驼峰格式

- Updated dependencies [206c806efa]
- Updated dependencies [0f15fc597c]
- Updated dependencies [dcad887024]
- Updated dependencies [a4672f7c16]
- Updated dependencies [7fff9020e1]
- Updated dependencies [1eea234fdd]
- Updated dependencies [84bfb439b8]
  - @modern-js/core@2.7.0
  - @modern-js/utils@2.7.0
  - @modern-js/plugin-changeset@2.7.0
  - @modern-js/plugin-i18n@2.7.0
  - @modern-js/plugin-lint@2.7.0
  - @modern-js/new-action@2.7.0
  - @modern-js/upgrade@2.7.0
  - @modern-js/plugin@2.7.0

## 2.6.0

### Minor Changes

- c1918f5: feat(module-tools): add new Buildpreset and `extendPreset` function
  feat(module-tools): 新增新的 buildPreset 以及 extendPreset 函数
- 9d1905a: feat: support to handle files add and unlink in watch mode
  feat: 支持在 watch 模式下处理文件的新增和删除
- 44e7b10: feat: add noDevTools hook. fix dev log content and add add chinese and english content
  feat: 增加 noDevTools hook. 修复 dev 的日志内容, 增加中英内容

### Patch Changes

- 5f66bc5: fix(module-tools): fix copy context error path
  fix(module-tools): 修复 copy context 错误路径的问题
- f0e41e7: fix: set composite false in bundle dts
  fix: 打包 d.ts 时设置 composite 为 false
- Updated dependencies [e1f799e]
- Updated dependencies [7915ab3]
- Updated dependencies [0fe658a]
  - @modern-js/utils@2.6.0
  - @modern-js/core@2.6.0
  - @modern-js/plugin-changeset@2.6.0
  - @modern-js/plugin-i18n@2.6.0
  - @modern-js/plugin-lint@2.6.0
  - @modern-js/new-action@2.6.0
  - @modern-js/upgrade@2.6.0
  - @modern-js/plugin@2.6.0

## 2.5.0

### Minor Changes

- 0bbc91a: support sideEffects config and change log level to info
  支持 sideEffects 配置并将日志级别改为 info

### Patch Changes

- 59172e9: feat: report size and info after build
  feat: 构建后报告文件大小和信息
- 138a6b5: chore: update README and description of module-tools packages

  chore: 更新 module-tools 相关包的 README 和 description

- Updated dependencies [89ca6cc]
- Updated dependencies [30614fa]
- Updated dependencies [1b0ce87]
- Updated dependencies [11c053b]
- Updated dependencies [577084d]
  - @modern-js/plugin-changeset@2.5.0
  - @modern-js/plugin-i18n@2.5.0
  - @modern-js/plugin-lint@2.5.0
  - @modern-js/new-action@2.5.0
  - @modern-js/plugin@2.5.0
  - @modern-js/core@2.5.0
  - @modern-js/utils@2.5.0
  - @modern-js/upgrade@2.5.0

## 2.4.0

### Patch Changes

- 72f837e: update rollup-plugin-dts version, support cts and mts file
  更新 rollup-plugin-dts 版本，支持 cts 和 mts 文件
- 76e15dc: feat: change dev log color
  feat: 修改 dev 展示的内容颜色
- 8c2db5f: feat(core): improve support for exporting a function in config file

  feat(core): 完善对配置文件中导出函数的支持

- Updated dependencies [98a2733]
- Updated dependencies [8c2db5f]
  - @modern-js/utils@2.4.0
  - @modern-js/core@2.4.0
  - @modern-js/new-action@2.4.0
  - @modern-js/plugin-changeset@2.4.0
  - @modern-js/plugin-i18n@2.4.0
  - @modern-js/plugin-lint@2.4.0
  - @modern-js/upgrade@2.4.0
  - @modern-js/plugin@2.4.0

## 2.3.0

### Minor Changes

- 7736171: feat: add watch hooks
  feat: 添加 watch hooks
- 7736171: feat: Remove the listening mode build task before Storybook starts
  feat: 在 Storybook 启动之前,移除监听模式的构建任务

### Patch Changes

- cdb8cd5: update libuild version
  升级 libuild 版本
- 7ad838e: fix umd code can not support es5 target
  修复 umd 的代码不能被转换成 es5 的问题
- Updated dependencies [65f1322]
- Updated dependencies [fd5a3ed]
- Updated dependencies [7b2cdcb]
- Updated dependencies [6ca1c0b]
- Updated dependencies [89b6739]
- Updated dependencies [7736171]
  - @modern-js/core@2.3.0
  - @modern-js/utils@2.3.0
  - @modern-js/plugin-changeset@2.3.0
  - @modern-js/plugin-lint@2.3.0
  - @modern-js/plugin-i18n@2.3.0
  - @modern-js/new-action@2.3.0
  - @modern-js/upgrade@2.3.0
  - @modern-js/plugin@2.3.0

## 2.2.0

### Minor Changes

- 481cd56: feat: add legacyDefineConfig function
  feat: 添加 legacyDefeinConfig 函数

### Patch Changes

- cb12ee7: chore: remove some unused deps, bump postcss version

  chore: 移除未使用的依赖, 升级 postcss 版本

- 8b7b39e: not use 'npm-library' preset by default
  默认不会使用 'npm-library' 预设
- ff10e87: fix: Using extends to solve the tsconfig configuration path conversion problem
  fix: 使用 extends 解决 tsconfig 配置路径转换的问题
- bff9de6: fix: Fix the failure to resolve the path correctly when running Storybook
  fix: 修复运行 Storybook 时候无法正确解析路径
- Updated dependencies [cb12ee7]
- Updated dependencies [49eff0c]
- Updated dependencies [360a259]
- Updated dependencies [12ef50f]
  - @modern-js/core@2.2.0
  - @modern-js/plugin-changeset@2.2.0
  - @modern-js/utils@2.2.0
  - @modern-js/plugin-lint@2.2.0
  - @modern-js/plugin-i18n@2.2.0
  - @modern-js/new-action@2.2.0
  - @modern-js/upgrade@2.2.0
  - @modern-js/plugin@2.2.0

## 2.1.0

### Patch Changes

- 2ad9642: feat: new command support --lang params

  feat: new 命令支持 --lang 参数

- fb3a9bf: support metafile
  支持生成 metafile
- 6562578: chore: optimize the capitalization of plugin names

  chore: 规范引用插件时的命名格式，统一使用 camelCase 代替 PascalCase

- Updated dependencies [837620c]
- Updated dependencies [bafa52e]
- Updated dependencies [8a9482c]
  - @modern-js/utils@2.1.0
  - @modern-js/core@2.1.0
  - @modern-js/plugin-changeset@2.1.0
  - @modern-js/plugin-i18n@2.1.0
  - @modern-js/plugin-lint@2.1.0
  - @modern-js/new-action@2.1.0
  - @modern-js/upgrade@2.1.0
  - @modern-js/plugin@2.1.0

## 2.0.2

### Patch Changes

- e27bbe4: update libuild version to support svgr in bundleless, and svgr only support default export
  更新 libuild 版本以支持 svgr 能在 bundleless 下工作，同时 svgr 只支持 default export
  - @modern-js/new-action@2.0.2
  - @modern-js/core@2.0.2
  - @modern-js/utils@2.0.2
  - @modern-js/plugin-changeset@2.0.2
  - @modern-js/plugin-i18n@2.0.2
  - @modern-js/plugin-lint@2.0.2
  - @modern-js/plugin@2.0.2
  - @modern-js/upgrade@2.0.2

## 2.0.1

### Patch Changes

- 00a2252: fix: module tools v2.0.0 bad version

  fix: 修复 module tools v2.0.0 版本问题

  - @modern-js/core@2.0.1
  - @modern-js/plugin-changeset@2.0.1
  - @modern-js/plugin-i18n@2.0.1
  - @modern-js/plugin-lint@2.0.1
  - @modern-js/new-action@2.0.1
  - @modern-js/plugin@2.0.1
  - @modern-js/upgrade@2.0.1
  - @modern-js/utils@2.0.1

## 2.0.0

### Major Changes

- dda38c9c3e: chore: v2

### Patch Changes

- d4a456659b: chore: rename plugin-jarvis to plugin-lint

  chore: 重命名 plugin-jarvis 为 plugin-lint

- ffb2ed4: feat:

  1. change storybook runtime logic
  2. export runtime api define from runtime module
  3. refactor defineConfig in module-tools

  feat:

  1. 更改 Storybook 对于 Runtime API 的处理逻辑
  2. 从 @modern-js/runtime 导出 Runtime API 的用户配置
  3. 重构 module-tools 的 defineConfig

- 824dc45: 默认关闭 svgr 功能
  close svgr default
- efb69f9: fix tsconfig extends path calculation errors
  修复 tsconfig 里 extends 路径计算错误的问题
- Updated dependencies [c9e800d39a]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [d4a456659b]
- Updated dependencies [f680410886]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [ffb2ed4]
- Updated dependencies [bbe4c4ab64]
  - @modern-js/core@2.0.0
  - @modern-js/utils@2.0.0
  - @modern-js/plugin-lint@2.0.0
  - @modern-js/plugin-changeset@2.0.0
  - @modern-js/plugin-i18n@2.0.0
  - @modern-js/new-action@2.0.0
  - @modern-js/plugin@2.0.0
  - @modern-js/upgrade@2.0.0

## 2.0.0-beta.7

### Major Changes

- dda38c9c3e: chore: v2

### Patch Changes

- d4a456659b: chore: rename plugin-jarvis to plugin-lint

  chore: 重命名 plugin-jarvis 为 plugin-lint

- Updated dependencies [c9e800d39a]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [d4a456659b]
- Updated dependencies [f680410886]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [bbe4c4ab64]
  - @modern-js/core@2.0.0-beta.7
  - @modern-js/utils@2.0.0-beta.7
  - @modern-js/plugin-lint@2.0.0-beta.7
  - @modern-js/plugin-changeset@2.0.0-beta.7
  - @modern-js/plugin-i18n@2.0.0-beta.7
  - @modern-js/new-action@2.0.0-beta.7
  - @modern-js/plugin@2.0.0-beta.7
  - @modern-js/upgrade@2.0.0-beta.7

## 2.0.0-beta.6

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- 92f0eade39: feat:

  1. add style config and add new hook
  2. add dts alias logic
  3. add copy logic
  4. add log logic
  5. add skipDeps config

  feat:

  1. 添加样式配置以及新的 hook
  2. 添加 dts 别名处理
  3. 添加 copy 逻辑
  4. 添加日志逻辑
  5. 添加 skipDeps 配置

- 4fd53b48fd: feat: add normalize config logic
  feat: 添加处理配置的逻辑
- f0ee9120db: feat: change dev menu log
  feat: 修改 dev 菜单展示的内容
- 148fbf8e25: feat: update afterBuild options
  feat: 更新 afterBuild 函数的参数
- 0bb776858a: feat: add ModuleContext
  feat: 添加 ModuleContext
- e6bfca6d31: feat: add type define and schema for config
  feat: 为配置增加类型定义和 schema
- 54abc88a2a: feat: add new and upgrade command
  feat: 添加 new 和 upgrade 命令
- e4558a0bc4: feat:

  1. add `runBin` function
  2. config internal plugins constants in the app/module/doc tools
  3. add app/module/doc tools internal plugins

  feat:

  1. 添加 `runBin` 函数
  2. 在 app/module/doc tools 里配置内部插件
  3. 增加 app/module/doc tools 使用的插件常量

### Patch Changes

- d6546ad916: add buildConfig style in module-tools and remove tools
  在 module-tools 里新增 buildConfig style 并删除 tools
- d61ca88a0b: update speedy version
  更新依赖里 speedy 的版本
- 94339fc: support svgr
  支持将 svg 转化为 react 组件
- 9f9ef4e6e3: fix: fix alias resolve
  fix: 修复别名处理
- b8bbe036c7: feat: export Hooks type
  feat: 导出 Hooks 类型
- 5282947: fix the wrong error message
  修复错误的报错信息
- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- f037ac0: upgrade libuild version and remove warning log
  升级 libuild 版本并移除构建的警告信息
- ebbeed1ece: update speedy-core to fix sass resolve error
  更新 speedy-core 版本以修复 sass resolve 错误
- d4a456659b: chore: rename plugin-jarvis to plugin-lint

  chore: 重命名 plugin-jarvis 为 plugin-lint

- b1bc873: fix dts bundle compilation options
  修复打包类型描述文件的 compilation options
- 540de1fd5d: fix: filename typo, color.ts --> colors.ts
  fix: 文件名错误，color.ts 修改为 colors.ts
- a2c8cc3eb5: fix: change tools define userconfig type
  fix: 修改工程定义的 UserConfig 类型
- 1be4ba1ccd: feat: add platform build log
  feat: 添加 platform 构建的 log 内容
- 14b712da84: fix: use consistent alias type and default value across packages

  fix: 在各个包中使用一致的 alias 类型定义和默认值

- Updated dependencies [7879e8f711]
- Updated dependencies [c9e800d39a]
- Updated dependencies [6aca875011]
- Updated dependencies [85edee888c]
- Updated dependencies [2e6031955e]
- Updated dependencies [7b7d12cf8f]
- Updated dependencies [7efeed4]
- Updated dependencies [92f0eade39]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f2e9]
- Updated dependencies [a3af050486]
- Updated dependencies [d4a456659b]
- Updated dependencies [92004d1906]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [f680410886]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [b710adb843]
- Updated dependencies [b7a96c35fc]
- Updated dependencies [cce8ecee2d]
- Updated dependencies [f179749375]
- Updated dependencies [b8494ef33b]
- Updated dependencies [ea7cf06257]
- Updated dependencies [bbe4c4ab64]
- Updated dependencies [e4558a0bc4]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/utils@2.0.0-beta.6
  - @modern-js/core@2.0.0-beta.6
  - @modern-js/plugin-lint@2.0.0-beta.6
  - @modern-js/plugin@2.0.0-beta.6
  - @modern-js/plugin-changeset@2.0.0-beta.6
  - @modern-js/plugin-i18n@2.0.0-beta.6
  - @modern-js/new-action@2.0.0-beta.6
  - @modern-js/upgrade@2.0.0-beta.6

## 2.0.0-beta.4

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- 92f0eade39: feat:

  1. add style config and add new hook
  2. add dts alias logic
  3. add copy logic
  4. add log logic
  5. add skipDeps config

  feat:

  1. 添加样式配置以及新的 hook
  2. 添加 dts 别名处理
  3. 添加 copy 逻辑
  4. 添加日志逻辑
  5. 添加 skipDeps 配置

- 4fd53b48fd: feat: add normalize config logic
  feat: 添加处理配置的逻辑
- f0ee9120db: feat: change dev menu log
  feat: 修改 dev 菜单展示的内容
- 148fbf8: feat: update afterBuild options
  feat: 更新 afterBuild 函数的参数
- 0bb776858a: feat: add ModuleContext
  feat: 添加 ModuleContext
- e6bfca6d31: feat: add type define and schema for config
  feat: 为配置增加类型定义和 schema
- 54abc88a2a: feat: add new and upgrade command
  feat: 添加 new 和 upgrade 命令
- e4558a0: feat:

  1. add `runBin` function
  2. config internal plugins constants in the app/module/doc tools
  3. add app/module/doc tools internal plugins

  feat:

  1. 添加 `runBin` 函数
  2. 在 app/module/doc tools 里配置内部插件
  3. 增加 app/module/doc tools 使用的插件常量

### Patch Changes

- d6546ad916: add buildConfig style in module-tools and remove tools
  在 module-tools 里新增 buildConfig style 并删除 tools
- d61ca88a0b: update speedy version
  更新依赖里 speedy 的版本
- 9f9ef4e: fix: fix alias resolve
  fix: 修复别名处理
- b8bbe036c7: feat: export Hooks type
  feat: 导出 Hooks 类型
- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- ebbeed1ece: update speedy-core to fix sass resolve error
  更新 speedy-core 版本以修复 sass resolve 错误
- d4a456659b: chore: rename plugin-jarvis to plugin-lint

  chore: 重命名 plugin-jarvis 为 plugin-lint

- 540de1fd5d: fix: filename typo, color.ts --> colors.ts
  fix: 文件名错误，color.ts 修改为 colors.ts
- a2c8cc3eb5: fix: change tools define userconfig type
  fix: 修改工程定义的 UserConfig 类型
- 1be4ba1ccd: feat: add platform build log
  feat: 添加 platform 构建的 log 内容
- 14b712da84: fix: use consistent alias type and default value across packages

  fix: 在各个包中使用一致的 alias 类型定义和默认值

- Updated dependencies [7879e8f]
- Updated dependencies [c9e800d39a]
- Updated dependencies [6aca875]
- Updated dependencies [85edee888c]
- Updated dependencies [2e6031955e]
- Updated dependencies [7b7d12c]
- Updated dependencies [92f0eade39]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f2e9]
- Updated dependencies [a3af050486]
- Updated dependencies [d4a456659b]
- Updated dependencies [92004d1906]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [f680410886]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [b710adb843]
- Updated dependencies [b7a96c35fc]
- Updated dependencies [cce8ecee2d]
- Updated dependencies [f179749375]
- Updated dependencies [b8494ef]
- Updated dependencies [ea7cf06]
- Updated dependencies [bbe4c4a]
- Updated dependencies [e4558a0]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/utils@2.0.0-beta.4
  - @modern-js/core@2.0.0-beta.4
  - @modern-js/plugin-lint@2.0.0-beta.4
  - @modern-js/plugin@2.0.0-beta.4
  - @modern-js/plugin-changeset@2.0.0-beta.4
  - @modern-js/plugin-i18n@2.0.0-beta.4
  - @modern-js/new-action@2.0.0-beta.4
  - @modern-js/upgrade@2.0.0-beta.4

## 2.0.0-beta.3

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- e4558a0: feat:

  1. add `runBin` function
  2. config internal plugins constants in the app/module/doc tools
  3. add app/module/doc tools internal plugins

  feat:

  1. 添加 `runBin` 函数
  2. 在 app/module/doc tools 里配置内部插件
  3. 增加 app/module/doc tools 使用的插件常量

### Patch Changes

- d61ca88a0b: update speedy version
  更新依赖里 speedy 的版本
- b8bbe036c7: feat: export Hooks type
  feat: 导出 Hooks 类型
- ebbeed1ece: update speedy-core to fix sass resolve error
  更新 speedy-core 版本以修复 sass resolve 错误
- d4a456659b: chore: rename plugin-jarvis to plugin-lint

  chore: 重命名 plugin-jarvis 为 plugin-lint

- 14b712da84: fix: use consistent alias type and default value across packages

  fix: 在各个包中使用一致的 alias 类型定义和默认值

- Updated dependencies [c9e800d39a]
- Updated dependencies [6aca875]
- Updated dependencies [85edee888c]
- Updated dependencies [2e60319]
- Updated dependencies [92f0eade39]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f2e9]
- Updated dependencies [a3af050]
- Updated dependencies [d4a456659b]
- Updated dependencies [92004d1906]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [f680410]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [b710adb]
- Updated dependencies [b7a96c3]
- Updated dependencies [cce8ece]
- Updated dependencies [f179749375]
- Updated dependencies [ea7cf06]
- Updated dependencies [bbe4c4a]
- Updated dependencies [e4558a0]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/core@2.0.0-beta.3
  - @modern-js/utils@2.0.0-beta.3
  - @modern-js/plugin-lint@2.0.0-beta.3
  - @modern-js/plugin@2.0.0-beta.3
  - @modern-js/babel-preset-module@2.0.0-beta.3
  - @modern-js/plugin-changeset@2.0.0-beta.3
  - @modern-js/plugin-i18n@2.0.0-beta.3
  - @modern-js/new-action@2.0.0-beta.3
  - @modern-js/babel-compiler@2.0.0-beta.3
  - @modern-js/style-compiler@2.0.0-beta.3
  - @modern-js/upgrade@2.0.0-beta.3

## 2.0.0-beta.2

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- 92f0ead: feat:

  1. add style config and add new hook
  2. add dts alias logic
  3. add copy logic
  4. add log logic
  5. add skipDeps config

  feat:

  1. 添加样式配置以及新的 hook
  2. 添加 dts 别名处理
  3. 添加 copy 逻辑
  4. 添加日志逻辑
  5. 添加 skipDeps 配置

- 4fd53b48fd: feat: add normalize config logic
  feat: 添加处理配置的逻辑
- f0ee9120db: feat: change dev menu log
  feat: 修改 dev 菜单展示的内容
- 0bb776858a: feat: add ModuleContext
  feat: 添加 ModuleContext
- e6bfca6d31: feat: add type define and schema for config
  feat: 为配置增加类型定义和 schema
- 54abc88a2a: feat: add new and upgrade command
  feat: 添加 new 和 upgrade 命令

### Patch Changes

- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- d4a4566: chore: rename plugin-jarvis to plugin-lint

  chore: 重命名 plugin-jarvis 为 plugin-lint

- 540de1fd5d: fix: filename typo, color.ts --> colors.ts
  fix: 文件名错误，color.ts 修改为 colors.ts
- a2c8cc3: fix: change tools define userconfig type
  fix: 修改工程定义的 UserConfig 类型
- 1be4ba1ccd: feat: add platform build log
  feat: 添加 platform 构建的 log 内容
- Updated dependencies [c9e800d39a]
- Updated dependencies [85edee888c]
- Updated dependencies [92f0ead]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f2e9]
- Updated dependencies [d4a4566]
- Updated dependencies [92004d1]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [f179749]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/core@2.0.0-beta.2
  - @modern-js/utils@2.0.0-beta.2
  - @modern-js/plugin-lint@2.0.0-beta.2
  - @modern-js/plugin@2.0.0-beta.2
  - @modern-js/plugin-changeset@2.0.0-beta.2
  - @modern-js/plugin-i18n@2.0.0-beta.2
  - @modern-js/new-action@2.0.0-beta.2
  - @modern-js/upgrade@2.0.0-beta.2

## 2.0.0-beta.1

### Major Changes

- dda38c9: chore: v2

### Minor Changes

- 92f0ead: feat:

  1. add style config and add new hook
  2. add dts alias logic
  3. add copy logic
  4. add log logic
  5. add skipDeps config

  feat:

  1. 添加样式配置以及新的 hook
  2. 添加 dts 别名处理
  3. 添加 copy 逻辑
  4. 添加日志逻辑
  5. 添加 skipDeps 配置

- 4fd53b48fd: feat: add normalize config logic
  feat: 添加处理配置的逻辑
- f0ee9120db: feat: change dev menu log
  feat: 修改 dev 菜单展示的内容
- 0bb776858a: feat: add ModuleContext
  feat: 添加 ModuleContext
- e6bfca6d31: feat: add type define and schema for config
  feat: 为配置增加类型定义和 schema
- 54abc88a2a: feat: add new and upgrade command
  feat: 添加 new 和 upgrade 命令

### Patch Changes

- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- d4a4566: chore: rename plugin-jarvis to plugin-lint

  chore: 重命名 plugin-jarvis 为 plugin-lint

- 540de1fd5d: fix: filename typo, color.ts --> colors.ts
  fix: 文件名错误，color.ts 修改为 colors.ts
- 1be4ba1ccd: feat: add platform build log
  feat: 添加 platform 构建的 log 内容
- Updated dependencies [c9e800d39a]
- Updated dependencies [85edee888c]
- Updated dependencies [92f0ead]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f]
- Updated dependencies [d4a4566]
- Updated dependencies [92004d1]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [f179749]
- Updated dependencies [abf3421]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712d]
  - @modern-js/core@2.0.0-beta.1
  - @modern-js/utils@2.0.0-beta.1
  - @modern-js/plugin-lint@2.0.0-beta.1
  - @modern-js/plugin@2.0.0-beta.1
  - @modern-js/plugin-changeset@2.0.0-beta.1
  - @modern-js/plugin-i18n@2.0.0-beta.1
  - @modern-js/new-action@2.0.0-beta.1
  - @modern-js/upgrade@2.0.0-beta.1

## 2.0.0-beta.0

### Major Changes

- dda38c9: chore: v2

### Minor Changes

- 4fd53b48f: feat: add normalize config logic
  feat: 添加处理配置的逻辑
- f0ee9120d: feat: change dev menu log
  feat: 修改 dev 菜单展示的内容
- 0bb776858: feat: add ModuleContext
  feat: 添加 ModuleContext
- e6bfca6d3: feat: add type define and schema for config
  feat: 为配置增加类型定义和 schema
- 54abc88a2: feat: add new and upgrade command
  feat: 添加 new 和 upgrade 命令

### Patch Changes

- cc971eabf: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- 540de1fd5: fix: filename typo, color.ts --> colors.ts
  fix: 文件名错误，color.ts 修改为 colors.ts
- 1be4ba1cc: feat: add platform build log
  feat: 添加 platform 构建的 log 内容
- Updated dependencies [c9e800d39]
- Updated dependencies [85edee8]
- Updated dependencies [edd1cfb1a]
- Updated dependencies [cc971eabf]
- Updated dependencies [5b9049f]
- Updated dependencies [b8bbe036c]
- Updated dependencies [d5a31df78]
- Updated dependencies [dda38c9]
- Updated dependencies [8b8e1bb57]
- Updated dependencies [3bbea92b2]
- Updated dependencies [abf3421]
- Updated dependencies [543be95]
- Updated dependencies [14b712d]
  - @modern-js/core@2.0.0-beta.0
  - @modern-js/utils@2.0.0-beta.0
  - @modern-js/plugin@2.0.0-beta.0
  - @modern-js/plugin-i18n@2.0.0-beta.0
  - @modern-js/new-action@2.0.0-beta.0
  - @modern-js/upgrade@2.0.0-beta.0

## 1.17.0

### Patch Changes

- 003837c: fix: ignore css when copy in style CompileMode is 'all'
  fix: 当 style 的编译模式为 'all'的时候, 忽略 css 文件的复制
- fb30bca: feat: add upgrade tools and command

  feat: 增加升级工具和升级命令

- Updated dependencies [1b9176f]
- Updated dependencies [77d3a38]
- Updated dependencies [fb30bca]
- Updated dependencies [f3fab28]
- Updated dependencies [151329d]
- Updated dependencies [367405a]
- Updated dependencies [5af9472]
- Updated dependencies [6b6a534]
- Updated dependencies [6b43a2b]
- Updated dependencies [9f4e5ce]
- Updated dependencies [58c53a7]
- Updated dependencies [a7be124]
- Updated dependencies [31547b4]
  - @modern-js/utils@1.17.0
  - @modern-js/upgrade@1.17.0
  - @modern-js/new-action@1.17.0
  - @modern-js/core@1.17.0
  - @modern-js/babel-preset-module@1.17.0
  - @modern-js/css-config@1.17.0
  - @modern-js/plugin-changeset@1.17.0
  - @modern-js/plugin-i18n@1.17.0
  - @modern-js/plugin-jarvis@1.17.0
  - @modern-js/babel-compiler@1.17.0
  - @modern-js/style-compiler@1.17.0
  - @modern-js/plugin@1.17.0

## 1.16.0

### Minor Changes

- 1100dd58c: chore: support react 18

  chore: 支持 React 18

### Patch Changes

- Updated dependencies [641592f52]
- Updated dependencies [3904b30a5]
- Updated dependencies [1100dd58c]
- Updated dependencies [e04e6e76a]
- Updated dependencies [81c66e4a4]
- Updated dependencies [2c305b6f5]
- Updated dependencies [9d9bbfd05]
  - @modern-js/utils@1.16.0
  - @modern-js/css-config@1.16.0
  - @modern-js/style-compiler@1.16.0
  - @modern-js/new-action@1.16.0
  - @modern-js/babel-preset-module@1.16.0
  - @modern-js/core@1.16.0
  - @modern-js/plugin-changeset@1.16.0
  - @modern-js/plugin-i18n@1.16.0
  - @modern-js/plugin-jarvis@1.16.0
  - @modern-js/babel-compiler@1.16.0
  - @modern-js/plugin@1.16.0

## 1.15.0

### Patch Changes

- Updated dependencies [8658a78]
- Updated dependencies [05d4a4f]
- Updated dependencies [ad05af9]
- Updated dependencies [5d53d1c]
- Updated dependencies [37cd159]
  - @modern-js/utils@1.15.0
  - @modern-js/new-action@1.15.0
  - @modern-js/babel-preset-module@1.15.0
  - @modern-js/core@1.15.0
  - @modern-js/css-config@1.15.0
  - @modern-js/plugin-changeset@1.15.0
  - @modern-js/plugin-i18n@1.15.0
  - @modern-js/plugin-jarvis@1.15.0
  - @modern-js/babel-compiler@1.15.0
  - @modern-js/style-compiler@1.15.0
  - @modern-js/plugin@1.15.0

## 1.7.1

### Patch Changes

- b2f90f8: feat: add addRuntimeExports hooks for module-tools
  feat: 为 module-tools 添加 addRuntimeExports 钩子

## 1.7.0

### Minor Changes

- 33cebd2: chore(plugin-i18n): merge `@modern-js/i18n-cli-language-detector` to `@modern-js/plugin-i18n`

  chore(plugin-i18n): 合并 `@modern-js/i18n-cli-language-detector` 包到 `@modern-js/plugin-i18n` 包作为子路径

### Patch Changes

- 307ce36: fix: ignore cjs and mjs in d.ts bundle

  fix: 对 d.ts 做 bundle 时忽略 cjs 和 mjs 资源

- f6681f2: feat: remove @modern-js/plugin-analyze plugin
  feat: 移除 @modern-js/plugin-analyze 插件
- Updated dependencies [33cebd2]
- Updated dependencies [33cebd2]
- Updated dependencies [33cebd2]
- Updated dependencies [2e8ea92]
- Updated dependencies [74e74ee]
- Updated dependencies [33cebd2]
  - @modern-js/core@1.13.0
  - @modern-js/plugin-changeset@1.4.0
  - @modern-js/plugin-i18n@1.3.0
  - @modern-js/new-action@1.3.12
  - @modern-js/babel-preset-module@1.4.0
  - @modern-js/css-config@1.2.8
  - @modern-js/plugin-jarvis@1.2.14
  - @modern-js/utils@1.7.12

## 1.6.3

### Patch Changes

- eeb9273: Add `additionalProperties: false` to the schema of 'output.buildConfig'

  为 'output.buildConfig' 的 schema 增加 `additionalProperties: false` 配置

- Updated dependencies [dc4676b]
- Updated dependencies [5b7a5a7]
- Updated dependencies [4a7f2a2]
  - @modern-js/utils@1.7.12
  - @modern-js/plugin@1.4.2
  - @modern-js/css-config@1.2.8
  - @modern-js/core@1.12.4
  - @modern-js/plugin-analyze@1.4.7

## 1.6.2

### Patch Changes

- ff3ba0220: fix(babel-preset-module): babel transform import path of the style file or the static file

  fix(babel-preset-module): 修复 Babel 在转换导入样式文件或者静态文件的路径出现的问题

- Updated dependencies [ff3ba0220]
  - @modern-js/babel-preset-module@1.3.11

## 1.6.1

### Patch Changes

- nothing happen, only bump
- Updated dependencies
  - @modern-js/babel-preset-module@1.3.10
  - @modern-js/core@1.12.4
  - @modern-js/style-compiler@1.2.12
  - @modern-js/utils@1.7.11
  - @modern-js/css-config@1.2.7
  - @modern-js/plugin-analyze@1.4.7
  - @modern-js/plugin-changeset@1.3.1
  - @modern-js/plugin-jarvis@1.2.14

## 1.6.0

### Minor Changes

- b82869d: - use speedy as a bundler to support bundle, and support dts and css bundle.
  - design `buildConfig` to support build for different scene, and design `buildPreset` to cover most of scenes.
  - add `tools.speedy` to receive custom speedy config.
  - remove child process to solving problems with serialisation parameters.
  - add more test cases, improve quality construction.
  - design a new log about build process

### Patch Changes

- Updated dependencies [b82869d]
- Updated dependencies [b82869d]
- Updated dependencies [b82869d]
- Updated dependencies [b82869d]
  - @modern-js/utils@1.7.10
  - @modern-js/babel-preset-module@1.3.9
  - @modern-js/core@1.12.3
  - @modern-js/style-compiler@1.2.11
  - @modern-js/css-config@1.2.7
  - @modern-js/plugin-analyze@1.4.7
  - @modern-js/plugin-changeset@1.3.1
  - @modern-js/plugin-jarvis@1.2.14

## 1.5.8

### Patch Changes

- eeedc80: feat: add plugin-jarvis to dependencies of solutions
- f29e9ba: feat: simplify context usage, no longer depend on containers
- Updated dependencies [f29e9ba]
- Updated dependencies [d9564f2]
- Updated dependencies [1a57595]
- Updated dependencies [42741db]
- Updated dependencies [341bb42]
- Updated dependencies [f29e9ba]
- Updated dependencies [a90bc96]
  - @modern-js/core@1.12.2
  - @modern-js/plugin-analyze@1.4.7
  - @modern-js/plugin-jarvis@1.2.14
  - @modern-js/plugin-changeset@1.3.1
  - @modern-js/new-action@1.3.11
  - @modern-js/plugin@1.4.0
  - @modern-js/utils@1.7.9
  - @modern-js/css-config@1.2.7

## 1.5.7

### Patch Changes

- b7a1cea52: feat: support utils in tools.babel
- Updated dependencies [9377d2d9d]
- Updated dependencies [8e1cedd8a]
- Updated dependencies [8c9ad1749]
- Updated dependencies [b7a1cea52]
- Updated dependencies [1ac68424f]
- Updated dependencies [3dfee700c]
  - @modern-js/core@1.12.0
  - @modern-js/css-config@1.2.7
  - @modern-js/style-compiler@1.2.10
  - @modern-js/utils@1.7.7
  - @modern-js/babel-preset-module@1.3.8
  - @modern-js/plugin@1.3.7
  - @modern-js/plugin-analyze@1.4.6
  - @modern-js/plugin-changeset@1.2.8

## 1.5.6

### Patch Changes

- a1198d509: feat: bump babel 7.18.0
- Updated dependencies [8d508c6ed]
- Updated dependencies [0eff2473c]
- Updated dependencies [a1198d509]
- Updated dependencies [f25d6a62e]
- Updated dependencies [a18926bbd]
- Updated dependencies [c7e38b4e6]
- Updated dependencies [8f7c0f898]
  - @modern-js/core@1.11.2
  - @modern-js/babel-preset-module@1.3.7
  - @modern-js/i18n-cli-language-detector@1.2.4
  - @modern-js/plugin-analyze@1.4.6
  - @modern-js/plugin-changeset@1.2.8
  - @modern-js/plugin-i18n@1.2.7
  - @modern-js/new-action@1.3.10
  - @modern-js/babel-compiler@1.2.6
  - @modern-js/style-compiler@1.2.9
  - @modern-js/plugin@1.3.6
  - @modern-js/css-config@1.2.6

## 1.5.5

### Patch Changes

- d6e1e8917: support --style-only param

## 1.5.4

### Patch Changes

- da65bf12: chore: merge plugin-fast-refresh into webpack
- b02a4c35: fix: fix missing peer deps
- Updated dependencies [f730081c]
- Updated dependencies [d1ab1f05]
- Updated dependencies [2ec8181a]
- Updated dependencies [6451a098]
- Updated dependencies [b02a4c35]
- Updated dependencies [7fcfd6cc]
- Updated dependencies [d5a2cfd8]
- Updated dependencies [437367c6]
  - @modern-js/core@1.11.1
  - @modern-js/utils@1.7.6
  - @modern-js/babel-preset-module@1.3.6
  - @modern-js/css-config@1.2.6
  - @modern-js/plugin-analyze@1.4.5
  - @modern-js/plugin-changeset@1.2.7

## 1.5.3

### Patch Changes

- b8cfc42cd: feat: prebundle tsconfig-paths and nanoid
- Updated dependencies [b8cfc42cd]
- Updated dependencies [804a5bb8a]
- Updated dependencies [3680834f2]
- Updated dependencies [a37960018]
  - @modern-js/utils@1.7.4
  - @modern-js/plugin-analyze@1.4.4
  - @modern-js/core@1.10.3
  - @modern-js/css-config@1.2.6
  - @modern-js/plugin-changeset@1.2.7
  - @modern-js/plugin-fast-refresh@1.2.6

## 1.5.2

### Patch Changes

- d32f35134: chore: add modern/jest/eslint/ts config files to .npmignore
- Updated dependencies [d5913bd96]
- Updated dependencies [d32f35134]
- Updated dependencies [43d9bb5fa]
- Updated dependencies [d9d398e16]
- Updated dependencies [6ae4a34ae]
- Updated dependencies [b80229c79]
- Updated dependencies [948cc4436]
  - @modern-js/plugin@1.3.4
  - @modern-js/babel-preset-module@1.3.5
  - @modern-js/core@1.10.2
  - @modern-js/css-config@1.2.6
  - @modern-js/i18n-cli-language-detector@1.2.3
  - @modern-js/plugin-analyze@1.4.3
  - @modern-js/plugin-changeset@1.2.7
  - @modern-js/plugin-fast-refresh@1.2.6
  - @modern-js/plugin-i18n@1.2.6
  - @modern-js/new-action@1.3.9
  - @modern-js/babel-compiler@1.2.5
  - @modern-js/style-compiler@1.2.6
  - @modern-js/utils@1.7.3

## 1.5.1

### Patch Changes

- 69a728375: fix: remove exports.jsnext:source after publish
- Updated dependencies [cd7346b0d]
- Updated dependencies [0e0537005]
- Updated dependencies [6b0bb5e3b]
- Updated dependencies [69a728375]
  - @modern-js/utils@1.7.2
  - @modern-js/babel-preset-module@1.3.4
  - @modern-js/babel-compiler@1.2.4
  - @modern-js/new-action@1.3.8
  - @modern-js/core@1.10.1
  - @modern-js/css-config@1.2.5
  - @modern-js/plugin-analyze@1.4.2
  - @modern-js/plugin-changeset@1.2.6
  - @modern-js/plugin-fast-refresh@1.2.5
  - @modern-js/plugin-i18n@1.2.5
  - @modern-js/style-compiler@1.2.5

## 1.5.0

### Minor Changes

- 0b26b93b: feat: prebundle all dependencies of @modern-js/core

### Patch Changes

- 592edabc: feat: prebundle url-join,mime-types,json5,fast-glob,globby,ora,inquirer
- 895fa0ff: chore: using "workspace:\*" in devDependencies
- Updated dependencies [2d155c4c]
- Updated dependencies [123e432d]
- Updated dependencies [e5a9b26d]
- Updated dependencies [0b26b93b]
- Updated dependencies [123e432d]
- Updated dependencies [f9f66ef9]
- Updated dependencies [592edabc]
- Updated dependencies [f9f66ef9]
- Updated dependencies [895fa0ff]
- Updated dependencies [3578913e]
- Updated dependencies [1c3beab3]
  - @modern-js/utils@1.6.0
  - @modern-js/core@1.9.0
  - @modern-js/plugin-analyze@1.4.1
  - @modern-js/new-action@1.3.7
  - @modern-js/babel-preset-module@1.3.3
  - @modern-js/css-config@1.2.4
  - @modern-js/plugin-changeset@1.2.5
  - @modern-js/plugin-fast-refresh@1.2.4

## 1.4.6

### Patch Changes

- 04ae5262: chore: bump @modern-js/utils to v1.4.1 in dependencies
- 60f7d8bf: feat: add tests dir to npmignore
- 3bf4f8b0: feat: support start api server only
- 305e0bb4: fix: commander.commandsMap typing not work
- Updated dependencies [a4330c73]
- Updated dependencies [b8599d09]
- Updated dependencies [6cffe99d]
- Updated dependencies [04ae5262]
- Updated dependencies [60f7d8bf]
- Updated dependencies [e4cec1ce]
- Updated dependencies [3b7aa8bb]
- Updated dependencies [5dbbeb57]
- Updated dependencies [ebfcbb35]
- Updated dependencies [3bf4f8b0]
- Updated dependencies [305e0bb4]
- Updated dependencies [ebfcbb35]
  - @modern-js/core@1.8.0
  - @modern-js/utils@1.5.0
  - @modern-js/babel-preset-module@1.3.2
  - @modern-js/css-config@1.2.4
  - @modern-js/i18n-cli-language-detector@1.2.2
  - @modern-js/plugin-changeset@1.2.5
  - @modern-js/plugin-fast-refresh@1.2.4
  - @modern-js/plugin-i18n@1.2.4
  - @modern-js/new-action@1.3.6
  - @modern-js/babel-compiler@1.2.3
  - @modern-js/style-compiler@1.2.4
  - @modern-js/plugin@1.3.3
  - @modern-js/plugin-analyze@1.4.0

## 1.4.5

### Patch Changes

- 07a4887e: feat: prebundle commander and signale to @modern-js/utils
- 17d0cc46: feat: prebundle lodash to @modern-js/utils/lodash
- Updated dependencies [60855eb2]
- Updated dependencies [046e58aa]
- Updated dependencies [ec1b7367]
- Updated dependencies [77ff9754]
- Updated dependencies [d2d1d6b2]
- Updated dependencies [07a4887e]
- Updated dependencies [ea2ae711]
- Updated dependencies [17d0cc46]
- Updated dependencies [d2d1d6b2]
  - @modern-js/core@1.7.0
  - @modern-js/plugin-analyze@1.3.6
  - @modern-js/utils@1.4.0
  - @modern-js/plugin-i18n@1.2.3
  - @modern-js/new-action@1.3.5
  - @modern-js/style-compiler@1.2.3
  - @modern-js/css-config@1.2.3
  - @modern-js/plugin-changeset@1.2.4
  - @modern-js/plugin-fast-refresh@1.2.3

## 1.4.4

### Patch Changes

- 12b4dd41: fix: throw error when tsc is not installed
- 132f7b53: feat: move config declarations to @modern-js/core
- 8491b6dd: fix: optimise "types" exports from plugin
- 133a5dd7: remove module hooks dep
- 9d4a005b: fix: config babel via tools.babel
- Updated dependencies [bebb39b6]
- Updated dependencies [ef28a4e6]
- Updated dependencies [132f7b53]
- Updated dependencies [ff73a5cc]
- Updated dependencies [9d4a005b]
  - @modern-js/css-config@1.2.3
  - @modern-js/plugin-analyze@1.3.5
  - @modern-js/plugin-changeset@1.2.4
  - @modern-js/plugin-fast-refresh@1.2.3
  - @modern-js/core@1.6.1
  - @modern-js/utils@1.3.7

## 1.4.3

### Patch Changes

- 366cf4fd: convert module-tools to new plugin
- Updated dependencies [05ce88a0]
- Updated dependencies [a8df060e]
- Updated dependencies [c2046f37]
- Updated dependencies [366cf4fd]
- Updated dependencies [61e3f623]
- Updated dependencies [6a7acb81]
- Updated dependencies [681a1ff9]
- Updated dependencies [4e2026e4]
  - @modern-js/core@1.6.0
  - @modern-js/utils@1.3.6
  - @modern-js/module-tools-hooks@1.2.3
  - @modern-js/plugin-changeset@1.2.3
  - @modern-js/plugin-fast-refresh@1.2.2
  - @modern-js/plugin-analyze@1.3.4

## 1.4.2

### Patch Changes

- 4b5d4bf4: feat: add img resource's inline and url type declaration
- 969f172f: support tools.styledComponents for module-tools,support close tsc process with disbaleTsChecker
- 55e18278: chore: remove unused dependencies and devDependencies
- edc3bd3d: fix: @modern-js/core package not found
- Updated dependencies [969f172f]
- Updated dependencies [4c792f68]
- Updated dependencies [83059b93]
- Updated dependencies [4b5d4bf4]
- Updated dependencies [62f5b8c8]
- Updated dependencies [55e18278]
- Updated dependencies [4499a674]
- Updated dependencies [403f5169]
- Updated dependencies [a7f42f48]
- Updated dependencies [83059b93]
  - @modern-js/core@1.4.4
  - @modern-js/utils@1.3.3
  - @modern-js/new-action@1.3.3
  - @modern-js/babel-compiler@1.2.2

## 1.4.1

### Patch Changes

- 02ff289d: Modify the type of error text and display log messages
- 54786e58: add ts check
- 6668a1bf: feat: upgrade @modern-js/codesmith-api-app version
- fab92861: fix: @modern-js/core phantom dep
- Updated dependencies [deeaa602]
- Updated dependencies [54786e58]
- Updated dependencies [6668a1bf]
- Updated dependencies [6668a1bf]
- Updated dependencies [fab92861]
  - @modern-js/plugin-analyze@1.3.3
  - @modern-js/utils@1.3.2
  - @modern-js/core@1.4.3
  - @modern-js/new-action@1.3.2
  - @modern-js/plugin-changeset@1.2.2
  - @modern-js/module-tools-hooks@1.2.2

## 1.4.0

### Minor Changes

- 67503500: add alais subCmd

### Patch Changes

- Updated dependencies [118da5b4]
- Updated dependencies [b376c8d6]
- Updated dependencies [e62c4efd]
- Updated dependencies [6891e4c2]
- Updated dependencies [e2a8233f]
  - @modern-js/css-config@1.2.2
  - @modern-js/style-compiler@1.2.2
  - @modern-js/core@1.4.2
  - @modern-js/plugin-analyze@1.3.2

## 1.3.2

### Patch Changes

- c78400c7: fix: remove stylus support
- Updated dependencies [b7a9eeba]
- Updated dependencies [53aca274]
- Updated dependencies [78279953]
- Updated dependencies [e116ace5]
- Updated dependencies [4d72edea]
  - @modern-js/plugin-analyze@1.3.1
  - @modern-js/core@1.4.1
  - @modern-js/utils@1.3.1

## 1.3.1

### Patch Changes

- 83166714: change .npmignore
- Updated dependencies [83166714]
- Updated dependencies [c3de9882]
- Updated dependencies [33ff48af]
- Updated dependencies [b7c48198]
  - @modern-js/babel-preset-module@1.3.1
  - @modern-js/core@1.3.2
  - @modern-js/css-config@1.2.1
  - @modern-js/i18n-cli-language-detector@1.2.1
  - @modern-js/plugin-analyze@1.2.1
  - @modern-js/plugin-changeset@1.2.1
  - @modern-js/plugin-fast-refresh@1.2.1
  - @modern-js/plugin-i18n@1.2.1
  - @modern-js/new-action@1.3.1
  - @modern-js/babel-compiler@1.2.1
  - @modern-js/style-compiler@1.2.1
  - @modern-js/module-tools-hooks@1.2.1
  - @modern-js/utils@1.2.2

## 1.3.0

### Minor Changes

- c5973e7a: add dev sub commands
- 0d9516f3: fix resolve static file and add -p params

### Patch Changes

- c1455cd6: fix module-tools type file
- Updated dependencies [823809c6]
- Updated dependencies [4584cc04]
- Updated dependencies [7c19fd94]
- Updated dependencies [0d9516f3]
  - @modern-js/utils@1.2.1
  - @modern-js/core@1.3.1
  - @modern-js/babel-preset-module@1.3.0

## 1.2.0

### Minor Changes

- cfe11628: Make Modern.js self bootstraping

### Patch Changes

- Updated dependencies [2da09c69]
- Updated dependencies [fc71e36f]
- Updated dependencies [2c049918]
- Updated dependencies [c3d46ee4]
- Updated dependencies [cfe11628]
- Updated dependencies [1ebc7ee2]
- Updated dependencies [146dcd85]
- Updated dependencies [1ebc7ee2]
  - @modern-js/utils@1.2.0
  - @modern-js/core@1.3.0
  - @modern-js/new-action@1.3.0
  - @modern-js/babel-preset-module@1.2.0
  - @modern-js/css-config@1.2.0
  - @modern-js/i18n-cli-language-detector@1.2.0
  - @modern-js/plugin-analyze@1.2.0
  - @modern-js/plugin-changeset@1.2.0
  - @modern-js/plugin-fast-refresh@1.2.0
  - @modern-js/plugin-i18n@1.2.0
  - @modern-js/babel-compiler@1.2.0
  - @modern-js/style-compiler@1.2.0
  - @modern-js/module-tools-hooks@1.2.0

## 1.1.5

### Patch Changes

- 2da27d3b: fix sourcemap 'source' config
- Updated dependencies [5e3de7d8]
- Updated dependencies [2da27d3b]
- Updated dependencies [4819a3c7]
- Updated dependencies [b7fb82ec]
- Updated dependencies [81d93503]
  - @modern-js/plugin-i18n@1.1.2
  - @modern-js/babel-compiler@1.1.4
  - @modern-js/new-action@1.2.2
  - @modern-js/plugin-changeset@1.1.2
  - @modern-js/utils@1.1.6

## 1.1.4

### Patch Changes

- 10676d31: fix build watch error

## 1.1.3

### Patch Changes

- ca7dcb32: support BUILD_FORMAT env and fix watch feature not work
- Updated dependencies [90eeb72c]
- Updated dependencies [e04914ce]
- Updated dependencies [e12b3d0b]
- Updated dependencies [ca7dcb32]
- Updated dependencies [e12b3d0b]
- Updated dependencies [5a4c557e]
- Updated dependencies [e04914ce]
- Updated dependencies [0c81020f]
- Updated dependencies [ca7dcb32]
- Updated dependencies [ecb344dc]
  - @modern-js/core@1.2.0
  - @modern-js/new-action@1.2.0
  - @modern-js/babel-preset-module@1.1.2
  - @modern-js/plugin-analyze@1.1.2
  - @modern-js/babel-compiler@1.1.3
  - @modern-js/utils@1.1.5

## 1.1.2

### Patch Changes

- d927bc83: add run platform task with RUN_PLATFORM env vars
- Updated dependencies [d927bc83]
- Updated dependencies [d73ff455]
- Updated dependencies [9c1ab865]
- Updated dependencies [c5e3d4ad]
- Updated dependencies [d73ff455]
- Updated dependencies [d73ff455]
- Updated dependencies [d73ff455]
- Updated dependencies [d73ff455]
  - @modern-js/utils@1.1.4
  - @modern-js/core@1.1.4
  - @modern-js/style-compiler@1.1.3
  - @modern-js/css-config@1.1.2
  - @modern-js/module-tools-hooks@1.1.2

## 1.1.1

### Patch Changes

- 0fa83663: support more .env files
- Updated dependencies [6f7fe574]
- Updated dependencies [0fa83663]
- Updated dependencies [f594fbc8]
  - @modern-js/core@1.1.2
  - @modern-js/babel-preset-module@1.1.1
  - @modern-js/css-config@1.1.1
  - @modern-js/i18n-cli-language-detector@1.1.1
  - @modern-js/plugin-analyze@1.1.1
  - @modern-js/plugin-changeset@1.1.1
  - @modern-js/plugin-fast-refresh@1.1.1
  - @modern-js/plugin-i18n@1.1.1
  - @modern-js/new-action@1.1.2
  - @modern-js/babel-compiler@1.1.2
  - @modern-js/style-compiler@1.1.1
  - @modern-js/module-tools-hooks@1.1.1
  - @modern-js/utils@1.1.2

## 1.1.0

### Minor Changes

- 96119db2: Relese v1.1.0

### Patch Changes

- Updated dependencies [96119db2]
- Updated dependencies [6b802b2a]
- Updated dependencies [eb00b569]
  - @modern-js/babel-preset-module@1.1.0
  - @modern-js/core@1.1.0
  - @modern-js/css-config@1.1.0
  - @modern-js/i18n-cli-language-detector@1.1.0
  - @modern-js/plugin-analyze@1.1.0
  - @modern-js/plugin-changeset@1.1.0
  - @modern-js/plugin-fast-refresh@1.1.0
  - @modern-js/plugin-i18n@1.1.0
  - @modern-js/new-action@1.1.0
  - @modern-js/babel-compiler@1.1.0
  - @modern-js/style-compiler@1.1.0
  - @modern-js/module-tools-hooks@1.1.0
  - @modern-js/utils@1.1.0

## 1.0.1

### Patch Changes

- feat: update generator template
- Updated dependencies [undefined]
  - @modern-js/new-action@1.0.1

## 1.0.0

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 0fd196e: feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [0fd196e]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/babel-preset-module@1.0.0
  - @modern-js/core@1.0.0
  - @modern-js/css-config@1.0.0
  - @modern-js/i18n-cli-language-detector@1.0.0
  - @modern-js/plugin-analyze@1.0.0
  - @modern-js/plugin-changeset@1.0.0
  - @modern-js/plugin-fast-refresh@1.0.0
  - @modern-js/plugin-i18n@1.0.0
  - @modern-js/new-action@1.0.0
  - @modern-js/babel-compiler@1.0.0
  - @modern-js/style-compiler@1.0.0
  - @modern-js/module-tools-hooks@1.0.0
  - @modern-js/utils@1.0.0

## 1.0.0-rc.23

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 0fd196e: feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [0fd196e]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/babel-preset-module@1.0.0-rc.23
  - @modern-js/core@1.0.0-rc.23
  - @modern-js/css-config@1.0.0-rc.23
  - @modern-js/i18n-cli-language-detector@1.0.0-rc.23
  - @modern-js/plugin-analyze@1.0.0-rc.23
  - @modern-js/plugin-changeset@1.0.0-rc.23
  - @modern-js/plugin-fast-refresh@1.0.0-rc.23
  - @modern-js/plugin-i18n@1.0.0-rc.23
  - @modern-js/new-action@1.0.0-rc.23
  - @modern-js/babel-compiler@1.0.0-rc.23
  - @modern-js/style-compiler@1.0.0-rc.23
  - @modern-js/module-tools-hooks@1.0.0-rc.23
  - @modern-js/utils@1.0.0-rc.23

## 1.0.0-rc.22

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 0fd196e: feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [0fd196e]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/babel-preset-module@1.0.0-rc.22
  - @modern-js/core@1.0.0-rc.22
  - @modern-js/css-config@1.0.0-rc.22
  - @modern-js/i18n-cli-language-detector@1.0.0-rc.22
  - @modern-js/plugin-analyze@1.0.0-rc.22
  - @modern-js/plugin-changeset@1.0.0-rc.22
  - @modern-js/plugin-fast-refresh@1.0.0-rc.22
  - @modern-js/plugin-i18n@1.0.0-rc.22
  - @modern-js/new-action@1.0.0-rc.22
  - @modern-js/babel-compiler@1.0.0-rc.22
  - @modern-js/style-compiler@1.0.0-rc.22
  - @modern-js/module-tools-hooks@1.0.0-rc.22
  - @modern-js/utils@1.0.0-rc.22

## 1.0.0-rc.21

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 0fd196e: feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [0fd196e]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/babel-preset-module@1.0.0-rc.21
  - @modern-js/core@1.0.0-rc.21
  - @modern-js/css-config@1.0.0-rc.21
  - @modern-js/i18n-cli-language-detector@1.0.0-rc.21
  - @modern-js/plugin-analyze@1.0.0-rc.21
  - @modern-js/plugin-changeset@1.0.0-rc.21
  - @modern-js/plugin-fast-refresh@1.0.0-rc.21
  - @modern-js/plugin-i18n@1.0.0-rc.21
  - @modern-js/new-action@1.0.0-rc.21
  - @modern-js/babel-compiler@1.0.0-rc.21
  - @modern-js/style-compiler@1.0.0-rc.21
  - @modern-js/module-tools-hooks@1.0.0-rc.21
  - @modern-js/utils@1.0.0-rc.21

## 1.0.0-rc.20

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [undefined]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/babel-preset-module@1.0.0-rc.20
  - @modern-js/core@1.0.0-rc.20
  - @modern-js/css-config@1.0.0-rc.20
  - @modern-js/i18n-cli-language-detector@1.0.0-rc.20
  - @modern-js/plugin-analyze@1.0.0-rc.20
  - @modern-js/plugin-changeset@1.0.0-rc.20
  - @modern-js/plugin-fast-refresh@1.0.0-rc.20
  - @modern-js/plugin-i18n@1.0.0-rc.20
  - @modern-js/new-action@1.0.0-rc.20
  - @modern-js/babel-compiler@1.0.0-rc.20
  - @modern-js/style-compiler@1.0.0-rc.20
  - @modern-js/module-tools-hooks@1.0.0-rc.20
  - @modern-js/utils@1.0.0-rc.20

## 1.0.0-rc.19

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/babel-preset-module@1.0.0-rc.19
  - @modern-js/core@1.0.0-rc.19
  - @modern-js/css-config@1.0.0-rc.19
  - @modern-js/i18n-cli-language-detector@1.0.0-rc.19
  - @modern-js/plugin-analyze@1.0.0-rc.19
  - @modern-js/plugin-changeset@1.0.0-rc.19
  - @modern-js/plugin-fast-refresh@1.0.0-rc.19
  - @modern-js/plugin-i18n@1.0.0-rc.19
  - @modern-js/new-action@1.0.0-rc.19
  - @modern-js/babel-compiler@1.0.0-rc.19
  - @modern-js/style-compiler@1.0.0-rc.19
  - @modern-js/module-tools-hooks@1.0.0-rc.19
  - @modern-js/utils@1.0.0-rc.19

## 1.0.0-rc.18

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/babel-preset-module@1.0.0-rc.18
  - @modern-js/core@1.0.0-rc.18
  - @modern-js/css-config@1.0.0-rc.18
  - @modern-js/i18n-cli-language-detector@1.0.0-rc.18
  - @modern-js/plugin-analyze@1.0.0-rc.18
  - @modern-js/plugin-changeset@1.0.0-rc.18
  - @modern-js/plugin-fast-refresh@1.0.0-rc.18
  - @modern-js/plugin-i18n@1.0.0-rc.18
  - @modern-js/new-action@1.0.0-rc.18
  - @modern-js/babel-compiler@1.0.0-rc.18
  - @modern-js/style-compiler@1.0.0-rc.18
  - @modern-js/module-tools-hooks@1.0.0-rc.18
  - @modern-js/utils@1.0.0-rc.18

## 1.0.0-rc.17

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
- Updated dependencies [undefined]
  - @modern-js/babel-preset-module@1.0.0-rc.17
  - @modern-js/core@1.0.0-rc.17
  - @modern-js/css-config@1.0.0-rc.17
  - @modern-js/i18n-cli-language-detector@1.0.0-rc.17
  - @modern-js/plugin-analyze@1.0.0-rc.17
  - @modern-js/plugin-changeset@1.0.0-rc.17
  - @modern-js/plugin-fast-refresh@1.0.0-rc.17
  - @modern-js/plugin-i18n@1.0.0-rc.17
  - @modern-js/new-action@1.0.0-rc.17
  - @modern-js/babel-compiler@1.0.0-rc.17
  - @modern-js/style-compiler@1.0.0-rc.17
  - @modern-js/module-tools-hooks@1.0.0-rc.17
  - @modern-js/utils@1.0.0-rc.17

## 1.0.0-rc.16

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-module@1.0.0-rc.16
  - @modern-js/core@1.0.0-rc.16
  - @modern-js/css-config@1.0.0-rc.16
  - @modern-js/i18n-cli-language-detector@1.0.0-rc.16
  - @modern-js/plugin-analyze@1.0.0-rc.16
  - @modern-js/plugin-changeset@1.0.0-rc.16
  - @modern-js/plugin-fast-refresh@1.0.0-rc.16
  - @modern-js/plugin-i18n@1.0.0-rc.16
  - @modern-js/new-action@1.0.0-rc.16
  - @modern-js/babel-compiler@1.0.0-rc.16
  - @modern-js/style-compiler@1.0.0-rc.16
  - @modern-js/module-tools-hooks@1.0.0-rc.16
  - @modern-js/utils@1.0.0-rc.16

## 1.0.0-rc.15

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-module@1.0.0-rc.15
  - @modern-js/core@1.0.0-rc.15
  - @modern-js/css-config@1.0.0-rc.15
  - @modern-js/i18n-cli-language-detector@1.0.0-rc.15
  - @modern-js/plugin-analyze@1.0.0-rc.15
  - @modern-js/plugin-changeset@1.0.0-rc.15
  - @modern-js/plugin-fast-refresh@1.0.0-rc.15
  - @modern-js/plugin-i18n@1.0.0-rc.15
  - @modern-js/new-action@1.0.0-rc.15
  - @modern-js/babel-compiler@1.0.0-rc.15
  - @modern-js/style-compiler@1.0.0-rc.15
  - @modern-js/module-tools-hooks@1.0.0-rc.15
  - @modern-js/utils@1.0.0-rc.15

## 1.0.0-rc.14

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-module@1.0.0-rc.14
  - @modern-js/core@1.0.0-rc.14
  - @modern-js/css-config@1.0.0-rc.14
  - @modern-js/i18n-cli-language-detector@1.0.0-rc.14
  - @modern-js/plugin-analyze@1.0.0-rc.14
  - @modern-js/plugin-changeset@1.0.0-rc.14
  - @modern-js/plugin-fast-refresh@1.0.0-rc.14
  - @modern-js/plugin-i18n@1.0.0-rc.14
  - @modern-js/new-action@1.0.0-rc.14
  - @modern-js/babel-compiler@1.0.0-rc.14
  - @modern-js/style-compiler@1.0.0-rc.14
  - @modern-js/module-tools-hooks@1.0.0-rc.14
  - @modern-js/utils@1.0.0-rc.14

## 1.0.0-rc.13

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-module@1.0.0-rc.13
  - @modern-js/core@1.0.0-rc.13
  - @modern-js/css-config@1.0.0-rc.13
  - @modern-js/i18n-cli-language-detector@1.0.0-rc.13
  - @modern-js/plugin-analyze@1.0.0-rc.13
  - @modern-js/plugin-changeset@1.0.0-rc.13
  - @modern-js/plugin-fast-refresh@1.0.0-rc.13
  - @modern-js/plugin-i18n@1.0.0-rc.13
  - @modern-js/new-action@1.0.0-rc.13
  - @modern-js/babel-compiler@1.0.0-rc.13
  - @modern-js/style-compiler@1.0.0-rc.13
  - @modern-js/module-tools-hooks@1.0.0-rc.13
  - @modern-js/utils@1.0.0-rc.13

## 1.0.0-rc.12

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-module@1.0.0-rc.12
  - @modern-js/core@1.0.0-rc.12
  - @modern-js/css-config@1.0.0-rc.12
  - @modern-js/i18n-cli-language-detector@1.0.0-rc.12
  - @modern-js/plugin-analyze@1.0.0-rc.12
  - @modern-js/plugin-changeset@1.0.0-rc.12
  - @modern-js/plugin-fast-refresh@1.0.0-rc.12
  - @modern-js/plugin-i18n@1.0.0-rc.12
  - @modern-js/new-action@1.0.0-rc.12
  - @modern-js/babel-compiler@1.0.0-rc.12
  - @modern-js/style-compiler@1.0.0-rc.12
  - @modern-js/module-tools-hooks@1.0.0-rc.12
  - @modern-js/plugin@1.0.0-rc.12
  - @modern-js/utils@1.0.0-rc.12

## 1.0.0-rc.11

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-module@1.0.0-rc.11
  - @modern-js/core@1.0.0-rc.11
  - @modern-js/css-config@1.0.0-rc.11
  - @modern-js/i18n-cli-language-detector@1.0.0-rc.11
  - @modern-js/plugin-analyze@1.0.0-rc.11
  - @modern-js/plugin-changeset@1.0.0-rc.11
  - @modern-js/plugin-fast-refresh@1.0.0-rc.11
  - @modern-js/plugin-i18n@1.0.0-rc.11
  - @modern-js/new-action@1.0.0-rc.11
  - @modern-js/babel-compiler@1.0.0-rc.11
  - @modern-js/style-compiler@1.0.0-rc.11
  - @modern-js/module-tools-hooks@1.0.0-rc.11
  - @modern-js/plugin@1.0.0-rc.11
  - @modern-js/utils@1.0.0-rc.11

## 1.0.0-rc.10

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-module@1.0.0-rc.10
  - @modern-js/core@1.0.0-rc.10
  - @modern-js/css-config@1.0.0-rc.10
  - @modern-js/i18n-cli-language-detector@1.0.0-rc.10
  - @modern-js/plugin-analyze@1.0.0-rc.10
  - @modern-js/plugin-changeset@1.0.0-rc.10
  - @modern-js/plugin-fast-refresh@1.0.0-rc.10
  - @modern-js/plugin-i18n@1.0.0-rc.10
  - @modern-js/new-action@1.0.0-rc.10
  - @modern-js/babel-compiler@1.0.0-rc.10
  - @modern-js/style-compiler@1.0.0-rc.10
  - @modern-js/module-tools-hooks@1.0.0-rc.10
  - @modern-js/plugin@1.0.0-rc.10
  - @modern-js/utils@1.0.0-rc.10

## 1.0.0-rc.9

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-module@1.0.0-rc.9
  - @modern-js/core@1.0.0-rc.9
  - @modern-js/css-config@1.0.0-rc.9
  - @modern-js/i18n-cli-language-detector@1.0.0-rc.9
  - @modern-js/plugin-analyze@1.0.0-rc.9
  - @modern-js/plugin-changeset@1.0.0-rc.9
  - @modern-js/plugin-fast-refresh@1.0.0-rc.9
  - @modern-js/plugin-i18n@1.0.0-rc.9
  - @modern-js/new-action@1.0.0-rc.9
  - @modern-js/babel-compiler@1.0.0-rc.9
  - @modern-js/style-compiler@1.0.0-rc.9
  - @modern-js/module-tools-hooks@1.0.0-rc.9
  - @modern-js/plugin@1.0.0-rc.9
  - @modern-js/utils@1.0.0-rc.9

## 1.0.0-rc.8

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-module@1.0.0-rc.8
  - @modern-js/core@1.0.0-rc.8
  - @modern-js/css-config@1.0.0-rc.8
  - @modern-js/i18n-cli-language-detector@1.0.0-rc.8
  - @modern-js/plugin-analyze@1.0.0-rc.8
  - @modern-js/plugin-changeset@1.0.0-rc.8
  - @modern-js/plugin-fast-refresh@1.0.0-rc.8
  - @modern-js/plugin-i18n@1.0.0-rc.8
  - @modern-js/new-action@1.0.0-rc.8
  - @modern-js/babel-compiler@1.0.0-rc.8
  - @modern-js/style-compiler@1.0.0-rc.8
  - @modern-js/module-tools-hooks@1.0.0-rc.8
  - @modern-js/plugin@1.0.0-rc.8
  - @modern-js/utils@1.0.0-rc.8

## 1.0.0-rc.7

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-module@1.0.0-rc.7
  - @modern-js/core@1.0.0-rc.7
  - @modern-js/css-config@1.0.0-rc.7
  - @modern-js/i18n-cli-language-detector@1.0.0-rc.7
  - @modern-js/plugin-analyze@1.0.0-rc.7
  - @modern-js/plugin-changeset@1.0.0-rc.7
  - @modern-js/plugin-fast-refresh@1.0.0-rc.7
  - @modern-js/plugin-i18n@1.0.0-rc.7
  - @modern-js/new-action@1.0.0-rc.7
  - @modern-js/babel-compiler@1.0.0-rc.7
  - @modern-js/style-compiler@1.0.0-rc.7
  - @modern-js/module-tools-hooks@1.0.0-rc.7
  - @modern-js/plugin@1.0.0-rc.7
  - @modern-js/utils@1.0.0-rc.7

## 1.0.0-rc.6

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-module@1.0.0-rc.6
  - @modern-js/core@1.0.0-rc.6
  - @modern-js/css-config@1.0.0-rc.6
  - @modern-js/i18n-cli-language-detector@1.0.0-rc.6
  - @modern-js/plugin-analyze@1.0.0-rc.6
  - @modern-js/plugin-changeset@1.0.0-rc.6
  - @modern-js/plugin-fast-refresh@1.0.0-rc.6
  - @modern-js/plugin-i18n@1.0.0-rc.6
  - @modern-js/new-action@1.0.0-rc.6
  - @modern-js/babel-compiler@1.0.0-rc.6
  - @modern-js/style-compiler@1.0.0-rc.6
  - @modern-js/module-tools-hooks@1.0.0-rc.6
  - @modern-js/plugin@1.0.0-rc.6
  - @modern-js/utils@1.0.0-rc.6

## 1.0.0-rc.5

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-module@1.0.0-rc.5
  - @modern-js/core@1.0.0-rc.5
  - @modern-js/css-config@1.0.0-rc.5
  - @modern-js/i18n-cli-language-detector@1.0.0-rc.5
  - @modern-js/plugin-analyze@1.0.0-rc.5
  - @modern-js/plugin-changeset@1.0.0-rc.5
  - @modern-js/plugin-fast-refresh@1.0.0-rc.5
  - @modern-js/plugin-i18n@1.0.0-rc.5
  - @modern-js/new-action@1.0.0-rc.5
  - @modern-js/babel-compiler@1.0.0-rc.5
  - @modern-js/style-compiler@1.0.0-rc.5
  - @modern-js/module-tools-hooks@1.0.0-rc.5
  - @modern-js/plugin@1.0.0-rc.5
  - @modern-js/utils@1.0.0-rc.5

## 1.0.0-rc.4

### Patch Changes

- fix server route match
- 204c626: feat: initial
- Updated dependencies [undefined]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-module@1.0.0-rc.4
  - @modern-js/core@1.0.0-rc.4
  - @modern-js/css-config@1.0.0-rc.4
  - @modern-js/i18n-cli-language-detector@1.0.0-rc.4
  - @modern-js/plugin-analyze@1.0.0-rc.4
  - @modern-js/plugin-changeset@1.0.0-rc.4
  - @modern-js/plugin-fast-refresh@1.0.0-rc.4
  - @modern-js/plugin-i18n@1.0.0-rc.4
  - @modern-js/new-action@1.0.0-rc.4
  - @modern-js/babel-compiler@1.0.0-rc.4
  - @modern-js/style-compiler@1.0.0-rc.4
  - @modern-js/module-tools-hooks@1.0.0-rc.4
  - @modern-js/plugin@1.0.0-rc.4
  - @modern-js/utils@1.0.0-rc.4

## 1.0.0-rc.3

### Patch Changes

- feat: initial
- Updated dependencies [undefined]
  - @modern-js/babel-preset-module@1.0.0-rc.3
  - @modern-js/core@1.0.0-rc.3
  - @modern-js/css-config@1.0.0-rc.3
  - @modern-js/i18n-cli-language-detector@1.0.0-rc.3
  - @modern-js/plugin-analyze@1.0.0-rc.3
  - @modern-js/plugin-changeset@1.0.0-rc.3
  - @modern-js/plugin-fast-refresh@1.0.0-rc.3
  - @modern-js/plugin-i18n@1.0.0-rc.3
  - @modern-js/new-action@1.0.0-rc.3
  - @modern-js/babel-compiler@1.0.0-rc.3
  - @modern-js/style-compiler@1.0.0-rc.3
  - @modern-js/module-tools-hooks@1.0.0-rc.3
  - @modern-js/plugin@1.0.0-rc.3
  - @modern-js/utils@1.0.0-rc.3
