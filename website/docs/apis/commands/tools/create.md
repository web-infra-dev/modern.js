---
title: 项目生成器
sidebar_position: 4
---

Modern.js 提供了 `create` 工具用于初始化不同工程方案项目。

## 基本使用

```bash
npx @modern-js/create [projectDir]
```

```bash
Usage: create [projectDir]

创建 @modern-js 应用

Options:
  -c, --config <config>  创建项目默认配置(JSON 字符串) (default: "{}")
  --mwa                  一键创建 MWA 应用(使用默认配置) (default: false)
  --module               一键创建模块化应用(使用默认配置) (default: false)
  --monorepo             一键常见 Monorepo 应用(使用默认配置) (default: false)
  --dist-tag <distTag>   生成项目时生成器使用特殊的 npm Tag (default: "")
  --registry <registry>  在创建过程中定制 npm Registry (default: "")
  -d,--debug             开启 Debug 模式，打印调试日志信息 (default: false)
  -h, --help             display help for command
```

:::info 补充信息
不需要全局安装 `@modern-js/create`，使用 npx 按需运行即可，可以保证始终运行最新版本的项目生成器。
:::
