---
sidebar_position: 2
---

# CLI 参数

`new` 命令提供了很多配置参数用于配置其执行过程中的行为，可以通过 `--help` 参数进行查看：

```bash
npm run new --help

Usage: modern new [options]

启用可选功能

Options:
  --lang <lang>          设置 new 命令执行语言(zh 或者 en)
  -c, --config <config>  生成器运行默认配置(JSON 字符串)
  -d, --debug            开启 Debug 模式，打印调试日志信息 (default: false)
  --dist-tag <tag>       生成器使用特殊的 npm Tag 版本
  -h, --help             display help for command
```

下面将针对这些参数做详细介绍：

## --lang \<lang>

执行执行语言，支持 `zh` 和 `en`。

默认情况下，`new` 命令会自动识别用户的系统语言，选择使用中文或者英文，如果识别失败或者不符合使用习惯，可以使用该参数手动指定。

## -c, --config \<config>

指定项目默认配置。

默认情况下，new 命令在执行过程中会出现选择操作类型、开启功能等交互问题，当需要提前指定这些配置内容时，可以通过该字段传入。

该字段为 JSON 字符串，例如需指定 BFF 框架时：

```bash
npm run new --config '{"framework": "express"}'
```

`config` 支持的参数可查看[配置参数](/guides/topic-detail/generator/new/config.html)。

## -d,--debug

展示调试日志。

当在使用过程中遇到问题时，可以使用该参数显示调试日志，方便快速定位问题位置及对问题进行排查。

## --registry \<registry>

指定执行子生成器和获取项目依赖版本的 npm registry。

## --dist-tag \<distTag>

指定生成器版本。

`new` 命令执行过程中会执行更小的微生成器，默认会使用 `latest` 的微生成器版本，使用该参数可以指定执行的微生成器的版本号的版本。

比如使用 `next` 版本：

```bash
npm run new --dist-tag next
```
