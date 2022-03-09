---
sidebar_position: 8
---

```bash
Usage: modern clear [options]

clear project dirs

Options:
  --remove-dirs [dirs...]  remove dirs, default is node_modules
  -h, --help               display help for command
```

import CommandTip from '@site/docs/components/command-tip.md'

<CommandTip />

默认对 Monorepo 以及 Monorepo 子项目的 `node_modules` 进行清理。

可以通过参数 `--remove-dirs` 来指定要删除的目录，例如执行：

```bash
$ npx modern clear --remove-dirs dist
```

则会清理所有 Monorepo 子项目的 `dist` 目录。
