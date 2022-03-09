---
sidebar_position: 1
---

```bash
Usage: modern dev [options]

本地开发命令

Options:
  --tsconfig [tsconfig]  指定 tsconfig.json 文件的路径 (default:
                         "./tsconfig.json")
  -h, --help             display help for command
```

import CommandTip from '@site/docs/components/command-tip.md'

<CommandTip />

## Storybook

`modern dev` 命令提供了基于 [Storybook](https://storybook.js.org/) 的组件开发调试模式。默认会识别项目根目录下 `stories` 目录中的 `*.stories.(j|t)sx` 文件。

:::caution 注意
模块工程方案中执行 `dev` 命令需要提前通过 [`new`](/docs/apis/commands/module/new) 命令启用 Storybook 调试能力。
:::
