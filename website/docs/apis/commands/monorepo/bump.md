---
sidebar_position: 4
---

```bash
Usage: modern bump [options]

使用变更集自动更新发布版本和变更日志

Options:
  --canary       创建一个预发布版本进行测试 (default: false)
  --preid <tag>  在对预发布版本进行版本控制时指定标识符 (default: "next")
  --snapshot     创建一个特殊版本进行测试 (default: false)
  -h, --help     display help for command
```

:::info 注
`bump` 命令执行之前需要提前执行 [`change`](/docs/apis/commands/monorepo/change) 命令添加 changeset。
:::

按 changeset 记录修改 `package.json` 中的版本号， 同时生成 `CHANGELOG.md`：

```bash
npx modern bump
🦋  All files have been updated. Review them and commit at your leisure
```

`CHANGELOG.md` 示例内容如下：

```md
# package-a

## 0.1.1
### Patch Changes

- test publish

```

import CommandTip from '@site/docs/components/command-tip.md'

<CommandTip />
