---
sidebar_position: 7
---

# 自定义提交 commit 信息

Changesets 支持配置 `commit` 为 true 时，在执行 `change` 和 `bump` 命令时自动提交当前变更。

默认的 `commit` 信息由 `@changesets/cli/commit` 提供，默认信息格式为：

![change commit](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/changeset-change-commit-info.png)
![bump commit](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/changeset-bump-commit-info.png)

当默认的 commit 信息不能满足需求时，支持自定义 commit 信息。

## 自定义 commit 信息内容

commit 信息分为两种：
- 执行 `change` 命令时自动生成的 commit 信息。
- 执行 `bump` 命令时自动生成的 commit 信息。

自定义逻辑主要实现两个函数，`getAddMessage` 和 `getVersionMessage`，分别用来定义上述这两种信息。

### getAddMessage

#### Params

- changeset

当前创建的 chagneset 信息

```typescript
type Release = {
    name: string;
    type: VersionType;
};

type Changeset = {
    summary: string;
    releases: Array<Release>;
};
```

- options

配置 commit 时的配置信息。

> commit 配置为数组时，第二个参数支持传入默认的配置信息，会对应的使用该参数传递。

#### 返回值

commit 信息内容。

#### 默认实现

`@changesets/cli/commit` 默认处理逻辑为以 `docs(changeset):` 开头，commit 信息为 changeset 的 `summary`，并根据传入的 `skipCI` 参数配置添加 [skip ci] 信息。

```typescript
type SkipCI = boolean | "add" | "version";

const getAddMessage = async (
  changeset: Changeset,
  options: { skipCI?: SkipCI } | null
) => {
  const skipCI = options?.skipCI === "add" || options?.skipCI === true;
  return outdent`docs(changeset): ${changeset.summary}${
    skipCI ? `\n\n[skip ci]\n` : ""
  }`;
};
```

> [outdent](https://www.npmjs.com/package/outdent) 目的是删除模板字符串开头的空格内容，使 commit 信息更符合规范。

### getVersionMessage

#### Params

- releasePlan

```typescript
type VersionType = "major" | "minor" | "patch" | "none";

type Release = {
    name: string;
    type: VersionType;
};

type Changeset = {
    id: string;
    summary: string;
    releases: Array<Release>;
};

type ComprehensiveRelease = {
    name: string;
    type: VersionType;
    oldVersion: string;
    newVersion: string;
    changesets: string[];
};

type PreState = {
    mode: "pre" | "exit"; // pre 模式当前状态
    tag: string; // pre 的类型
    initialVersions: {
        [pkgName: string]: string; // 版本升级前包名及版本号信息，Map 格式
    };
    changesets: string[]; // 本次升级的 changeset id 列表
};

type ReleasePlan = {
    changesets: Changeset[]; // 本次升级的 changeset 列表
    releases: ComprehensiveRelease[]; // 当前升级的包信息，包含包名称、当前版本、升级后版本、升级类型等
    preState: PreState | undefined; // 当前如果为 pre 发布，提供相关状态信息
};
```

- options

配置 commit 时的配置信息。

> commit 配置为数组时，第二个参数支持传入默认的配置信息，会对应的使用该参数传递。

#### 返回值

commit 信息内容。

#### 默认实现

`@changesets/cli/commit` 默认处理逻辑为：先展示当前需要 release 的包数量，再展示 release 包的名称及新版本号，并根据传入的 `skipCI` 参数配置添加 [skip ci] 信息。

```typescript
const getVersionMessage = async (
  releasePlan: ReleasePlan,
  options: { skipCI?: SkipCI } | null
) => {
  const skipCI = options?.skipCI === "version" || options?.skipCI === true;
  const publishableReleases = releasePlan.releases.filter(
    release => release.type !== "none"
  );
  const numPackagesReleased = publishableReleases.length;

  const releasesLines = publishableReleases
    .map(release => `  ${release.name}@${release.newVersion}`)
    .join("\n");

  return outdent`
    RELEASING: Releasing ${numPackagesReleased} package(s)

    Releases:
    ${releasesLines}
    ${skipCI ? `\n[skip ci]\n` : ""}
`;
};
```

## 配置

Changesets 配置文件中 `commit` 字段，该字段用于标记是否需要在 `change` 和 `bump` 命令是提交 commit 信息及 commit 信息的获取途径。

该配置可以为 `boolean`，为 true 时使用默认 `@changesets/cli/commit` 格式化 commit 信息。

该配置可以为字符串，直接声明获取 commit 信息模块的模块名称或者路径。

该配置还支持配置数组，数组中第一个元素为获取 commit 信息模块的模块名称或者路径，第二个元素为传入对应函数的参数值，会作为 `getAddMessage` 和 `getVersionMessage` 函数的第二个参数传入。


### 配置相对路径

commit 配置如果为相对路径为 `.changesets` 目录下的相对路径。

例如创建 .changeset/my-commit-config.js 文件，定义如下内容：

```javascript title=".changeset/my-commit-config.js"
async function getAddMessage(changeset, options) {}

async function getVersionMessage(releasePlan, options) {}

module.exports = {
  getAddMessage,
  getVersionMessage,
};
```

commit 配置为 ./my-commit-config.js 即可:

```json title=".changesets/config.json"
{
  "changelog": "./my-commit-config.js",
   ...
}
```

### 使用模块工程方案

自定义 commit 还可以使用模块工程方案进行管理，提供通用方案。

自定义 Changelog 还可以使用模块工程方案进行管理，提供通用方案。

#### 使用 `npx @modern-js/create` 创建模块工程方案。

``` md
? 请选择你想创建的工程类型 模块
? 请填写项目名称 custom-commit
? 请选择开发语言 TS
? 请选择包管理工具 pnpm
? 是否需要调整默认配置? 否
```

#### 实现自定义内容。

```typescript title="src/index.ts"
export async function getAddMessage() {}

export async function getVersionMessage() {}

```

#### 将模块发布到 NPM。

#### 在目标仓库根目录安装对应模块，例如 custom-commit。
#### 配置 changeset 的 commit 配置为包名称。

```json title="package.json"
{
  "changelog": "custom-commit",
   ...
}
```

### 使用 Monorepo 工程方案

如果你当前仓库为 Monorepo 工程方案，可以直接使用模块子项目进行管理。

#### 执行 `pnpm run new` 创建模块子项目。

``` md
? 请选择你想创建的工程类型 模块
? 请填写子项目名称 custom-commit
? 请填写子项目目录名称 custom-commit
? 请选择开发语言 TS
? 是否需要调整默认配置? 否
```

#### 实现自定义内容。

```typescript title="src/index.ts"
export async function getAddMessage() {}

export async function getVersionMessage() {}

```

#### 在 Monorepo 根目录添加子项目模块依赖，例如 custom-commit。

```json title="package.json"
{
  "devDependencies": {
    "custom-commit": "workspace: *",
    ...
  }
}
```

#### 配置 changeset 的 commit 配置为包名称。

```json title=".changesets/config.json"
{
  "commit": "custom-commit",
   ...
}
```

该模块发布到 NPM 后，依然可以和模块类型一样供其他仓库使用。
