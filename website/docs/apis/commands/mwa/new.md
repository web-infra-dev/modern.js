---
sidebar_position: 2
---

```bash
Usage: modern new [options]

MWA 项目中中执行生成器

Options:
  -d, --debug            开启 Debug 模式，打印调试日志信息 (default: false)
  -c, --config <config>  生成器运行默认配置(JSON 字符串)
  --dist-tag <tag>       生成器使用特殊的 npm Tag 版本
  --registry             生成器运行过程中定制 npm Registry
  -h, --help             display help for command
```

`modern new` 命令用于在已有项目中添加项目元素。

比如添加应用入口、启用启用一些可选功能如 Tailwind CSS、微前端开发模式等。

import CommandTip from '@site/docs/components/command-tip.md'

<CommandTip />

### 添加入口

在 MWA 项目中，执行 `new` 命令添加入口如下：

```bash
$ npx modern new
? 请选择你想要的操作 创建工程元素
? 创建工程元素 新建「应用入口」
? 请填写入口名称 entry
? 是否需要调整默认配置? 否
```

### 启用启用可选功能

在 MWA 应用项目中，执行 `new` 命令启用可选能力如下：

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

:::caution 注意
`--config` 参数对应参数值需要使用 JSON 字符串。

pnpm 暂不支持使用 JSON 字符串作为参数值，可使用 `npm new` 开启相关功能。【[相关 Issue](https://github.com/pnpm/pnpm/issues/3876)】
:::
