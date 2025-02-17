# @modern-js/plugin-v2

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
