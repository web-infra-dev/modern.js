---
sidebar_position: 7
---

```bash
Usage: modern pre [options] <enter|exit> [tag]

进入和退出预发布模式

Options:
  -h, --help  display help for command
```

可以使用 `modern pre` 命令在正式发布前[预发布](https://github.com/atlassian/changesets/blob/main/docs/prereleases.md)一个版本。

首先 `modern pre enter <tag>` 进入预发布模式：


```bash
$ npx modern pre enter next
🦋  success Entered pre mode with tag next
🦋  info Run `changeset version` to version packages with prerelease versions
✨  Done in 5.30s.
```

之后通过 `modern change` 命令添加 changeset：

```bash
$ npx modern change
🦋  What kind of change is this for module-example? (current version is 0.1.1) · patch
🦋  Please enter a summary for this change (this will be in the changelogs). Submit empty line to open external editor
🦋  Summary · test pre publish
🦋  === Releasing the following packages ===
🦋  [Patch]
🦋    module
🦋  Is this your desired changeset? (Y/n) · true
🦋  Changeset added! - you can now commit it
🦋
🦋  If you want to modify or expand on the changeset summary, you can find it here
🦋  info /xxxx/module-example/.changeset/old-spies-float.md
```

接着可以使用 `modern bump` 命令更新具体的版本号：

```bash
$ npx modern bump
🦋  warn ===============================IMPORTANT!===============================
🦋  warn You are in prerelease mode
🦋  warn If you meant to do a normal release you should revert these changes and run `changeset pre exit`
🦋  warn You can then run `changeset version` again to do a normal release
🦋  warn ----------------------------------------------------------------------
🦋  All files have been updated. Review them and commit at your leisure
```

可以看到 `package.json` 中版本号已经更新到 `0.1.2-next.0`。

import CommandTip from '@site/docs/components/command-tip.md'

<CommandTip />
