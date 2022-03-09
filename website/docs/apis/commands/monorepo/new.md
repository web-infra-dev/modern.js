---
sidebar_position: 1
---

```bash
Usage: modern new [options]

Monorepo 创建子项目

Options:
  -d, --debug            开启 Debug 模式，打印调试日志信息 (default: false)
  -c, --config <config>  生成器运行默认配置(JSON 字符串)
  --dist-tag <tag>       生成器使用特殊的 npm Tag 版本
  --registry             生成器运行过程中定制 npm Registry
  -h, --help             display help for command
```

import CommandTip from '@site/docs/components/command-tip.md'

<CommandTip />

`modern new` 命令在 monorepo 中可以用来添加 MWA 应用和可复用的模块：

```bash
$ modern new
? 请选择你想创建的工程类型 (Use arrow keys)
❯ 应用
  应用（测试）
  模块
  模块（内部）
```
MWA 应用默认会添加到 `apps` 目录， 测试应用会添加到 `examples` 目录，公共模块默认会添加到 `packages` 目录， 内部模块默认会添加到 `features` 目录。

内部模块在 monorepo 的应用里面使用时，可以无需构建直接使用源码。

:::caution 注意
`--config` 参数对应参数值需要使用 JSON 字符串。

pnpm 暂不支持使用 JSON 字符串作为参数值，可使用 `npm new` 开启相关功能。【[相关 Issue](https://github.com/pnpm/pnpm/issues/3876)】
:::
