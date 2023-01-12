# @modern-js/module-tools

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
