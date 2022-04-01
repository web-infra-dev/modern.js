---
sidebar_position: 2
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

`modern change` 命令添加 changeset：

```bash
$ npx modern change
🦋  Which packages would you like to include? · package-a, package-b
🦋  Which packages should have a major bump? · No items were selected
🦋  Which packages should have a minor bump? · No items were selected
🦋  The following packages will be patch bumped:
🦋  package-a@0.1.0
🦋  package-b@0.1.0
🦋  Please enter a summary for this change (this will be in the changelogs). Submit empty line to open external editor
🦋  Summary · test publish
🦋  === Releasing the following packages ===
🦋  [Patch]
🦋    package-a, package-b
🦋  ╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
🦋  ║                                                      ========= NOTE ========                                                       ║
🦋  ║All dependents of these packages that will be incompatible with the new version will be patch bumped when this changeset is applied.║
🦋  ╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
🦋  Is this your desired changeset? (Y/n) · true
🦋  Changeset added! - you can now commit it
🦋
🦋  If you want to modify or expand on the changeset summary, you can find it here
🦋  info /xxxx/monorepo/.changeset/long-lizards-talk.md
```
上面我们给 `package-a` 和 `package-b` 都选择了 `patch` 变更，具体的变更信息在 monorepo 根目录下的 `.changeset/long-lizards-talk.md` 中:

```md
---
"package-a": patch
"package-b": patch
---

test publish
```

import CommandTip from '@site/docs/components/command-tip.md'

<CommandTip />
