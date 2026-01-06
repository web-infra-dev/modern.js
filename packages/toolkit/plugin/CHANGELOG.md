# @modern-js/plugin-v2

## 3.0.0-alpha.1

### Patch Changes

- Updated dependencies [952f6fe]
  - @modern-js/types@3.0.0-alpha.1
  - @modern-js/runtime-utils@3.0.0-alpha.1
  - @modern-js/utils@3.0.0-alpha.1

## 3.0.0-alpha.0

### Patch Changes

- Updated dependencies [952f6fe]
  - @modern-js/types@3.0.0-alpha.0
  - @modern-js/runtime-utils@3.0.0-alpha.0
  - @modern-js/utils@3.0.0-alpha.0

## 2.68.1

### Patch Changes

- @modern-js/runtime-utils@2.68.1
- @modern-js/types@2.68.1
- @modern-js/utils@2.68.1

## 2.68.0

### Patch Changes

- @modern-js/runtime-utils@2.68.0
- @modern-js/types@2.68.0
- @modern-js/utils@2.68.0

## 2.67.11

### Patch Changes

- @modern-js/runtime-utils@2.67.11
- @modern-js/types@2.67.11
- @modern-js/utils@2.67.11

## 2.67.10

### Patch Changes

- @modern-js/runtime-utils@2.67.10
- @modern-js/types@2.67.10
- @modern-js/utils@2.67.10

## 2.67.9

### Patch Changes

- 474aa1e: feat: export APIs to support modern.js rsbuild storybook addon
  feat: 暴露 createStorybookOptions 和 resolveStorybookOptions API 支持 storybook 插件
  - @modern-js/runtime-utils@2.67.9
  - @modern-js/types@2.67.9
  - @modern-js/utils@2.67.9

## 2.67.8

### Patch Changes

- Updated dependencies [23c8201]
  - @modern-js/utils@2.67.8
  - @modern-js/runtime-utils@2.67.8

## 2.67.7

### Patch Changes

- @modern-js/runtime-utils@2.67.7
- @modern-js/utils@2.67.7

## 2.67.6

### Patch Changes

- e67b6d0: feat: add middlewares and renderMiddlewares to server plugin context
  feat: 添加 middlewares 和 renderMiddlewares 到服务端插件上下文中
- a3e140d: fix: proxy may not exist when run in low browser

  fix: 修复在低版本浏览器 proxy 可能不存在问题

  - @modern-js/runtime-utils@2.67.6
  - @modern-js/utils@2.67.6

## 2.67.5

### Patch Changes

- @modern-js/runtime-utils@2.67.5
- @modern-js/utils@2.67.5

## 2.67.4

### Patch Changes

- 35e9786: feat: modern.server supports extended server
  feat: modern.server 支持扩展 modern.js 服务
- Updated dependencies [3a66335]
- Updated dependencies [03cf233]
- Updated dependencies [446939a]
- Updated dependencies [446939a]
- Updated dependencies [b00922e]
- Updated dependencies [446939a]
  - @modern-js/runtime-utils@2.67.4
  - @modern-js/utils@2.67.4

## 2.67.3

### Patch Changes

- @modern-js/runtime-utils@2.67.3
- @modern-js/utils@2.67.3

## 2.67.2

### Patch Changes

- Updated dependencies [8f97aae]
  - @modern-js/runtime-utils@2.67.2
  - @modern-js/utils@2.67.2

## 2.67.1

### Patch Changes

- Updated dependencies [1d96265]
  - @modern-js/utils@2.67.1
  - @modern-js/runtime-utils@2.67.1

## 2.67.0

### Patch Changes

- @modern-js/runtime-utils@2.67.0
- @modern-js/utils@2.67.0

## 2.66.0

### Minor Changes

- e48a5ae: feat: server plugin use plugin v2

  feat: server 插件使用 plugin v2 实现

### Patch Changes

- @modern-js/runtime-utils@2.66.0
- @modern-js/utils@2.66.0

## 2.65.5

### Patch Changes

- Updated dependencies [90a3c1c]
- Updated dependencies [58a1afd]
  - @modern-js/runtime-utils@2.65.5
  - @modern-js/utils@2.65.5

## 2.65.4

### Patch Changes

- 7bce153: feat: rename runtime plugin modifyRuntimeConfig hook to config

  feat: 重命名 runtime 插件 modifyRuntimeConfig 钩子为 config

- Updated dependencies [0d47cb8]
- Updated dependencies [f1cd095]
  - @modern-js/utils@2.65.4
  - @modern-js/runtime-utils@2.65.4

## 2.65.3

### Patch Changes

- Updated dependencies [087ae7c]
  - @modern-js/runtime-utils@2.65.3
  - @modern-js/utils@2.65.3

## 2.65.2

### Patch Changes

- 63d477e: feat: use assign to update context

  feat: 使用 assign 函数更新 context 信息

- Updated dependencies [793be44]
- Updated dependencies [1fe923c]
- Updated dependencies [8837b85]
- Updated dependencies [1f83d96]
  - @modern-js/runtime-utils@2.65.2
  - @modern-js/utils@2.65.2

## 2.65.1

### Patch Changes

- @modern-js/runtime-utils@2.65.1
- @modern-js/utils@2.65.1

## 2.65.0

### Patch Changes

- @modern-js/runtime-utils@2.65.0
- @modern-js/utils@2.65.0

## 2.64.3

### Patch Changes

- @modern-js/runtime-utils@2.64.3
- @modern-js/utils@2.64.3

## 2.64.2

### Patch Changes

- 80fe649: fix: plugin v2 runtime export add node config

  fix: plugin v2 runtime 导出增加 node 配置

- 18b55af: feat: move modifyServerRoutes hook to plugin v2

  feat: 将 modifyServerRoutes 钩子函数移动到 plugin v2 中

  - @modern-js/runtime-utils@2.64.2
  - @modern-js/utils@2.64.2

## 2.64.1

### Patch Changes

- b69c8fa: feat: use `jiti` to read config file for supporting esm import

  feat: 使用 `jiti` 读取配置文件，支持 esm 导入

- 88aafcb: feat: load env in appTools when before the first time load modern config
  feat: 在 appTools 在第一次加载 modern config 之前，加载环境变量
- f83fd60: feat: migrate \_internalRuntimePlugins and \_internalServerPlugins hooks to plugin v2

  feat: 迁移 \_internalRuntimePlugins 和 \_internalServerPlugins hook 函数到 plugin-v2

- c5bb493: feat: cli plugin support ExtendConfigUtils

  feat: cli 插件支持扩展 config 工具函数

  - @modern-js/runtime-utils@2.64.1
  - @modern-js/utils@2.64.1

## 2.64.0

### Minor Changes

- 9e6f86e: feat: runtime plugin use plugin v2

  feat: runtime 插件使用插件 v2

### Patch Changes

- 48c11bf: feat: enhance plugin API type inference, supporting extendsHooks and extendsAPI

  feat: 增强 plugin api 类型推断，支持 extendsHooks 和 extendsAPI

  - @modern-js/node-bundle-require@2.64.0
  - @modern-js/runtime-utils@2.64.0
  - @modern-js/utils@2.64.0

## 2.63.7

### Patch Changes

- fa20ea7: feat: plugin run support config params to overrides config file content

  feat: 插件 run 方法支持添加更高优先级的配置参数

- fa20ea7: feat: adjust after dev hook type and run time

  feat: 调整 onAfterDev 钩子函数的类型和执行时机

- fa20ea7: feat: add onDevCompileDone hook

  feat: 添加 onDevCompileDone 钩子函数

- 775bc3b: feat: plugin api add isPluginExists

  feat: 插件 api 增加 isPluginExists

- 28ec156: feat: cli plugin support extend build utils

  feat: cli 插件支持扩展构建工具函数

- fa20ea7: feat: handle api not register error

  feat: api 未注册时增加 debug 调试信息

  - @modern-js/node-bundle-require@2.63.7
  - @modern-js/utils@2.63.7

## 2.63.6

### Patch Changes

- 4492a5d: feat: support isPluginExists for plugin manager

  feat: 插件支持 isPluginExists 方法

  - @modern-js/node-bundle-require@2.63.6
  - @modern-js/utils@2.63.6

## 2.63.5

### Patch Changes

- @modern-js/node-bundle-require@2.63.5
- @modern-js/utils@2.63.5
