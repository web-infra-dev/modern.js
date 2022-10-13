---
sidebar_position: 9
---

```bash
Usage: modern release [options]

发布 npm 包

Options:
  --tag <tag>       发布 npm 包使用特定的 tag (default: "")
  --ignore-scripts  发布时忽略 package.json 中的 scripts 命令，仅支持在 pnpm monorepo
                    中使用 (default: "")
  -h, --help        display help for command
```

`modern release` 命令可以将模块发布到 npm。

* `--tag` 参数可以指定发布时具体的 dist tag。

:::info 补充信息
执行 release 命令之前，需要将当前代码变更提交。

release 命令默认会生成当前发布的 git tags，执行 `git push --follow-tags` 将当前 release 对应的 tags 推送到远程仓库。
:::

import CommandTip from '@site/docs/components/command-tip.md'

<CommandTip />
