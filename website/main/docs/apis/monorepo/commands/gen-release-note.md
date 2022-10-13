---
sidebar_position: 9
---

```bash
Usage: modern gen-release-note [options]

根据当前仓库 changeset 文件生成 Release Note

Options:
  --repo <repo>      仓库名称，用于生成 Pull Request 链接， 例如： modern-js-dev/modern.js
  --custom <cumtom>  自定义 Release Note 生成函数
  -h, --help         display help for command
```

根据当前仓库的 changeset 信息自动生成 Release Note。

:::warning 注意
需要在 bump 命令之前执行。
:::

``` markdown
## Features:

[[#1160](https://github.com/modern-js-dev/modern.js/pull/1160)] export ExecaError type

## Bug Fix:

[[#1264](https://github.com/modern-js-dev/modern.js/pull/1264)] fix: conventional router app use App.init not work

```

import CommandTip from '@site/docs/components/command-tip.md'

<CommandTip />
