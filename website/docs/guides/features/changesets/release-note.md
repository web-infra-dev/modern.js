---
sidebar_position: 8
---

# 自定义 Release Note 格式

Modern.js 提供了 `modern gen-release-note` 命令，支持通过当前存在的 changeset 和 git commit 信息自动生成 Release Note 信息，在发布命令执行之前，可以通过执行该命令生成本次发布的 Release Note。

默认生成的 Release Note 格式为：

```markdown
[[#1220](https://github.com/modern-js-dev/modern.js/pull/1220)] feat: support bff operators -- Ming
```

根据 commit 信息获取 changeset 的 Pull Request ID，并生成 Github 的链接，内容为 changeset 的 changelog 信息和作者信息。

当默认生成 Release Note 逻辑不能满足需求时，支持自定义 Release Note 格式。

## 信息

### 自定义 Release Note 所需信息

生成 Release Note 信息需要先收集一些信息，比如 commit ID、Pull Request ID、commit message 等等。

该逻辑可通过 `getReleaseInfo` 函数实现。

#### getReleaseInfo

##### Params

- commit

类型： string;

当前 changeset 对应的 commit message 信息。

执行 `git log --pretty=format:%h--%s--%an .changeset/${changeset.id}.md` 的结果。

- commitObj

初步解析 commit 获取基本信息。

```typescript
interface Commit {
  id: string; // commit id
  type: 'feature' | 'fix'; // commit 类型，默认通过开头字符串如果为 fix，类型为 fix，其他为 feature
  repository?: string; // 参数传入的 repo 信息或者 package.json 中定义的 repository 信息
  pullRequestId?: string;
  author?: string;
  message: string; // commit message
  summary: string; // changeset summary
  [key: string]: string | undefined;
}
```

##### 返回值

commitObj， 补充后完整的 commit 对象。

##### 默认实现

Modern.js 的默认实现为：根据 commit 信息拆分出 Pull Request ID 和作者，加入到 commitObj 中。

```typescript
function getReleaseInfo(commit: string, commitObj: Commit) {
  const commitRegex = /(.*)\(#(\d*)\)/;

  const [, message, author] = commit.split('--');

  commitObj.author = author;

  if ((message || commitObj.summary).match(commitRegex)) {
    const [, messageShort, pullRequestId] = (
      message || commitObj.summary
    ).match(commitRegex)!;
    commitObj.pullRequestId = pullRequestId;
    commitObj.message = messageShort.trim();
  }

  return commitObj;
}
```

### 使用获取的信息生成 Release Note

根据 `getReleaseInfo` 中获取的 commit 对象信息，生成对应的 Release Note。

该逻辑可通过 `getReleaseNoteLine` 函数实现。

#### getReleaseNoteLine

##### Params

- commit

类型和上述 commitObj 类型一致。

##### 返回值

生成的 Release Note。

##### 默认实现

Modern.js 的默认实现为：

```typescript
function formatSummary(summary: string, pullRequestId?: string) {
  const [firstLine, ...futureLines] = summary
    .split('\n')
    .map(l => l.trimRight());

  let returnVal = firstLine;

  if (futureLines.length > 0) {
    if (pullRequestId) {
      returnVal = `\n\n  ${returnVal}`;
    } else {
      returnVal = `\n  ${returnVal}`;
    }
    returnVal += `\n\n  ${futureLines
      .filter(l => Boolean(l))
      .map(l => l)
      .join('\n\n')}`;
  }
  return returnVal;
}

export async function getReleaseNoteLine(
  commit: Commit,
  customReleaseNoteFunction?: CustomReleaseNoteFunction,
) {
  if (customReleaseNoteFunction?.getReleaseNoteLine) {
    return customReleaseNoteFunction.getReleaseNoteLine(commit);
  }

  const { repository, pullRequestId, summary } = commit;
  if (pullRequestId && repository) {
    return `- [#${pullRequestId}](https://github.com/${repository}/pull/${pullRequestId}) ${formatSummary(
      summary,
      pullRequestId,
    )}\n`;
  }
  if (pullRequestId) {
    return `#${pullRequestId} ${formatSummary(summary, pullRequestId)}\n`;
  }
  return `${formatSummary(summary, pullRequestId)}\n`;
}
```

## 使用自定义模块

`gen-release-note` 命令支持 `--custom` 参数，该参数可传入自定义 release note 模块的模块名称或者路径。

### 配置相对路径

custom 参数值如果为相对路径为**项目跟目录**。

例如创建 `scripts/my-release-note-config.js` 文件，定义如下内容：

```typescript title="scripts/my-release-note-config.js"
function getReleaseInfo(commit, commitObj) {
  return commitObj;
}

function getReleaseNoteLine(commit) {}

module.exports = {
  getReleaseInfo,
  getReleaseNoteLine,
};

```

执行下面命令：

```bash
pnpm run gen-release-note -- --custom ./scripts/my-release-note-config.js
```

也可以把命令参数直接定义到 package.json 中：

```json title="package.json"
{
    "scripts": {
        ...
        "gen-release-note": "modern gen-release-note --custom ./scripts/my-release-note-config.js"
    },
    ...
}
```

直接执行命令 `pnpm run gen-release-note` 即可。

### 使用模块工程方案

custom 参数值还可以使用模块工程方案进行管理，提供通用方案。

1. 使用 npx @modern-js/create 创建模块工程方案。

``` md
? 请选择你想创建的工程类型 模块
? 请填写项目名称 custom-release-note
? 请选择开发语言 TS
? 请选择包管理工具 pnpm
? 是否需要调整默认配置? 否
```

2. 实现自定义内容。

```typescript title="src/index.ts"
export function getReleaseInfo() {}

export function getReleaseNoteLine() {}

```

3. 将模块发布到 NPM。
4. 在目标仓库根目录安装对应模块，例如 `custom-release-note`。
5. 执行 gen-release-note 命令添加 custom 参数

```bash
pnpm run gen-release-note -- --custom custom-release-note
```

### 使用Monorepo 工程方案

如果你当前仓库为 Monorepo 工程方案，可以直接使用模块子项目进行管理。

1. 执行 `pnpm run new` 创建模块子项目

``` md
? 请选择你想创建的工程类型 模块
? 请填写子项目名称 custom-release-note
? 请填写子项目目录名称 custom-release-note
? 请选择开发语言 TS
? 是否需要调整默认配置? 否
```

2. 实现自定义内容。

```typescript title="src/index.ts"
export function getReleaseInfo() {}

export function getReleaseNoteLine() {}

```

3. 在 Monorepo 根目录添加子项目模块依赖，例如 `custom-release-note`。

```json title="package.json"
{
  "devDependencies": {
    "custom-release-note": "workspace: *",
    ...
}
```

4. 执行 `gen-release-note` 命令添加 `--custom` 参数

```bash
pnpm run gen-release-note -- --custom custom-release-note
```

该模块发布到 NPM 后，依然可以和模块类型一样供其他仓库使用。
