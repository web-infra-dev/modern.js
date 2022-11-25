---
sidebar_position: 2
---

```bash
Usage: modern new [options]

Execution Generator in App

Options:
  -d, --debug            using debug mode to log something (default: false)
  -c, --config <config>  set default generator config(json string)
  --dist-tag <tag>       use specified tag version for its generator
  --registry             set npm registry url to run npm command
  -h, --help             show command help
```

The `modern new` command is used to enable features to an existing project.

For example, add application entry, enable some optional features such as Tailwind CSS, micro frontend, etc.

import CommandTip from '@site-docs/components/command-tip.md'

<CommandTip />

### Add Entry

In the project, execute the `new` command to add entries as follows:

```bash
$ npx modern new
? 请选择你想要的操作 创建工程元素
? 创建工程元素 新建「应用入口」
? 请填写入口名称 entry
? 是否需要调整默认配置? 否
```

### Enable Features

In the project, execute the `new` command to enable features as follows:

```bash
$ npx modern new
? 请选择你想要的操作 启用可选功能
? 启用可选功能 (Use arrow keys)
❯ 启用 Tailwind CSS 支持
  启用 Less 支持
  启用 Sass 支持
  启用「BFF」功能
  启用「微前端」模式
  启用「单元测试 / 集成测试」功能
  启用「Visual Testing (Storybook)」模式
```

:::caution
The `--config` parameter needs to use a JSON string.

pnpm does not support the use of JSON strings as parameter values currently. Use `npm new` to turn on.【[Relate Issue](https://github.com/pnpm/pnpm/issues/3876)】
:::
