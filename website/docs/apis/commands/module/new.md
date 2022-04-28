---
sidebar_position: 4
---

```bash
Usage: modern new [options]

模块化工程方案中执行生成器

Options:
  -d, --debug            开启 Debug 模式，打印调试日志信息 (default: false)
  -c, --config <config>  生成器运行默认配置(JSON 字符串)
  --dist-tag <tag>       生成器使用特殊的 npm Tag 版本
  --registry             生成器运行过程中定制 npm Registry
  -h, --help             display help for command
```

import CommandTip from '@site/docs/components/command-tip.md'

<CommandTip />


`modern new` 命令在模块工程方案中可以用来启用 Less、Sass 或 Storybook 调试等能力:

```bash
$ npx modern new
? 请选择你想要的操作 启用可选功能
? 启用可选功能 (Use arrow keys)
❯ 启用 Tailwind CSS 支持
  启用 Less 支持
  启用 Sass 支持
  启用「Storybook」
  启用「Runtime API」
```

运行命令后，回车选择对应的能力即可启用。

:::caution 注意
`--config` 参数对应参数值需要使用 JSON 字符串。

pnpm 暂不支持使用 JSON 字符串作为参数值，可使用 `npm new` 开启相关功能。【[相关 Issue](https://github.com/pnpm/pnpm/issues/3876)】
:::
