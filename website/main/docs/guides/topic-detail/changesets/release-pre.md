---
sidebar_position: 4
---

# 发布预发布版本

在发布正式版本之前，我们也需要发布预发布版本供内部测试和用户使用，Changesets 也支持发布预发布版本。

## 步骤

:::info
以下示例命令都以 pnpm 作为包管理工具进行，如果需要使用其他包管理工具，请按需求进行替换。
:::


#### 执行以下命令升级预发布版本版本号：

```bash
pnpm run bump -- --canary --preid <preid>
```

`preid` 为预发布版本标记，例如 `alpha`、`beta` 等，默认值为 `next`。

使用 `--canary` 参数后，`bump` 命令由以下三个步骤完成：
- `changeset pre enter <preid>` 进入预发布模式

- `changeset version` 升级版本号

- `changeset pre exit` 退出预发布模式

#### 检查相关变更并提交

检查相关版本号变更是否正确，并提交变更。

建议预发布操作不在主分支上进行，不合入主分支，当预发布验证完成后，直接基于主分支发布正式版本。

#### 执行以下命令发布预发布版本：

```bash
pnpm run release -- --tag <tag>
```

发布预发布版本一定要使用 `--tag` 参数，参数值最好和 `preid` 值相同，方便用户使用。

## 注意事项

### 退出预发布模式

在进入预发布模式后，Changesets 会自动在 `.changeset` 目录创建 `pre.json` 文件用于记录当时进入预发布模式的一些状态信息，当出现状态信息和当前仓库状态不一致时，可直接删除该文件退出预发布模式。
