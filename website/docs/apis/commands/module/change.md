---
sidebar_position: 6
---

```bash
Usage: modern change [options]

创建变更集

Options:
  --empty     创建空变更集 (default: false)
  --open      使用编辑器中打开创建的变更集 (default: false)
  -h, --help  display help for command
```

:::info 注
[`change`](/docs/apis/commands/module/change)、[`pre`](/docs/apis/commands/module/pre)、[`bump`](/docs/apis/commands/module/bump)、[`release`](/docs/apis/commands/module/release) 命令集成了工具 [`changesets`](https://github.com/atlassian/changesets) 管理版本变更和 Changelog。
:::

`modern change` 命令用于添加 changeset:

```bash
$ npx modern change
🦋  What kind of change is this for module-example? (current version is 0.1.0) · patch
🦋  Please enter a summary for this change (this will be in the changelogs). Submit empty line to open external editor
🦋  Summary · publish test
🦋  === Releasing the following packages ===
🦋  [Patch]
🦋    module
🦋  Is this your desired changeset? (Y/n) · true
🦋  Changeset added! - you can now commit it
🦋
🦋  If you want to modify or expand on the changeset summary, you can find it here
🦋  info /xxxxxx/module/.changeset/brave-dryers-agree.md
```

具体的变更信息在项目目录 `.changeset/brave-dryers-agree.md` 中:

```md
---
"module-example": patch
---

publish test
```

import CommandTip from '@site/docs/components/command-tip.md'

<CommandTip />
