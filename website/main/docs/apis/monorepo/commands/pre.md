---
sidebar_position: 3
---

```bash
Usage: modern pre [options] <enter|exit> [tag]

进入和退出预发布模式

Options:
  -h, --help  display help for command
```

import CommandTip from '@site/docs/components/command-tip.md'

<CommandTip />

可以使用 `modern pre` 命令在正式发布前[预发布](https://github.com/atlassian/changesets/blob/main/docs/prereleases.md)一个版本。

首先 `modern pre enter <tag>` 进入预发布模式:

```bash
$ npx modern pre enter next
🦋  success Entered pre mode with tag next
🦋  info Run `changeset version` to version packages with prerelease versions
```

之后通过 `modern change` 命令添加 changeset:

```bash
$ npx modern change
🦋  Which packages would you like to include? · package-a, package-b
🦋  Which packages should have a major bump? · No items were selected
🦋  Which packages should have a minor bump? · No items were selected
🦋  The following packages will be patch bumped:
🦋  package-a@0.1.1
🦋  package-b@0.1.1
🦋  Please enter a summary for this change (this will be in the changelogs). Submit empty line to open external editor
🦋  Summary · test pre publish
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
🦋  info /xxxxxx/monorepo/.changeset/beige-paws-rule.md
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

可以看到 `package-a` 和 `package-b` 的 `package.json` 中版本号均已更新到 `0.1.2-next.0`。

提交完变更之后，我们可以通过 `modern pre exit` 命令退出预发布模式。
