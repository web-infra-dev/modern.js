---
sidebar_position: 7
---

```bash
Usage: modern deploy [options]

deploy project

Options:
  -p, --path [path]  Specify the path of the product output (default: "output")
  -h, --help         display help for command
```

import CommandTip from '@site/docs/components/command-tip.md'

<CommandTip />

对指定的项目进行部署，会通过指定项目分析其依赖的 Monorepo 下的子项目。

在执行命令之后，会首先生成 `output` 目录，在目录当中包含了指定部署的项目以及其依赖的子项目，形成一个最小集合的 Monorepo。

:::info 补充信息
`output` 目录是默认目录，可以通过 `-p` 参数进行自定义。
:::

然后会在 `output` 目录下进行依赖的安装以及必要文件的复制。

最后当依赖安装完成后，便完成了对指定项目的部署任务。

例如部署项目名称为 `app` 的应用，则可以执行：

```
pnpm deploy app
```

:::info 补充信息
其中 `app` 为项目的 `package.json` 的 `name` 值。
:::
