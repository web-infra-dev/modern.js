---
sidebar_position: 6
---

```bash
Usage: modern lint [options] [...files]

lint and fix source files

Options:
  --no-fix    disable auto fix source file
  -h, --help  display help for command
```

import CommandTip from '@site/docs/components/command-tip.md'

<CommandTip />

运行 `ESLint` 检查 monorepo 中代码语法情况， 通长情况下，我们只需要在 `git commit` 阶段通过 `lint-staged` 检查本次提交修改的部分代码。

* `--no-fix` 参数设置后可以关闭自动修复 lint 错误代码的能力。
