---
sidebar_position: 6
---

# 自定义 Changelog 生成

Changesets 默认会使用 `@changesets/cli/changelog` 生成 Changelog 信息，如果默认的 Changelog 信息不能满足需求，可以自定义 Changelog 的生成。

## 自定义 Changlog 内容

Changelog 信息主要包含以下两种信息：

- changeset 中写入的 Changelog 信息。

- 本次版本升级关联包的版本变更信息。

自定义逻辑主要实现两个函数，`getReleaseLine` 和 `getDependencyReleaseLine`，分别用来定义上述这两种信息。

### getReleaseLine

#### Params

- changeset

```typescript
export type VersionType = "major" | "minor" | "patch" | "none";

export type Release = { name: string; type: VersionType };

export type Changeset = {
  id: string; // changeset 的文件名称
  commit?: string; // changeset 提交时的 commit id 信息
  summary: string; // changeset 内容信息
  releases: Array<Release>; // 当前计算出的 changeset 升级包名称及类型信息
};
```

- type

当前包对应的升级版本类型，类型为上述 `VersionType`。

#### 返回值

Changelog 内容。

#### 默认实现

`@changesets/cli/changelog` 默认处理逻辑为将 `summary` 信息按照换行符 `\n` 分割，第一样前面增加 `-` 作为列表开头，其他内容作为第一行内容的补充整理在列表下方。

```typescript
async function getReleaseLine(changeset, type) {
  const [firstLine, ...futureLines] = changeset.summary
    .split('\n')
    .map(l => l.trimRight());

  let returnVal = `- ${
    changeset.commit ? `${changeset.commit}: ` : ''
  }${firstLine}`;

  if (futureLines.length > 0) {
    returnVal += `\n${futureLines.map(l => `  ${l}`).join('\n')}`;
  }

  return returnVal;
}
```

### getDependencyReleaseLine

#### Params

- changesets

当前关联的所有 changeset 信息，类型为 `getReleaseLine` changeset 类型数组。

- dependenciesUpdated

```typescript
type ModCompWithPackage = {
    name: string; // 依赖模块名称
    type: VersionType; // 依赖模块的升级类型
    oldVersion: string; // 依赖模块当前版本号
    newVersion: string; // 依赖模块新版本号
    changesets: string[]; // 关联的 changeset id 列表
    packageJson: PackageJSON; // 依赖模块完整的 package.json 内容
    dir: string; // 依赖模块的路径(绝对路径)
};

type DependenciesUpdated = ModCompWithPackage[]
```

#### 返回值

Changelog 内容。

#### 默认实现

`@changesets/cli/changelog` 默认会使用 changesets 信息展示对应的 `Updated dependencies + commit id`，以列表形式展示。然后根据 `dependenciesUpdated` 信息展示对应的依赖包包名和新版本号，作为列表的子列表项。

```typescript
async function getDependencyReleaseLine(changesets, dependenciesUpdated) {
    console.log("getDependencyReleaseLine", changesets, dependenciesUpdated)
    if (dependenciesUpdated.length === 0) return "";

    const changesetLinks = changesets.map(
      changeset =>
        `- Updated dependencies${
          changeset.commit ? ` [${changeset.commit}]` : ""
        }`
    );

    const updatedDepenenciesList = dependenciesUpdated.map(
      dependency => `  - ${dependency.name}@${dependency.newVersion}`
    );

    return [...changesetLinks, ...updatedDepenenciesList].join("\n");
}
```

展示效果为：

```markdown
- Updated dependencies [f0438ab]
- Updated dependencies [f0438ab]
  - module-3@2.0.0
  - module-1@0.2.0
```

## 配置

Changesets 配置文件中 `changelog` 字段，该字段用于标记 Changelog 信息的获取途径。

该配置可以为字符串，直接声明获取 Changelog 信息模块的模块名称或者路径。

该配置还支持配置数组，数组中第一个元素为获取 Changelog 信息模块的模块名称或者路径，第二个元素为传入对应函数的参数值，会作为 `getReleaseLine` 和 `getDependencyReleaseLine` 函数的第三个参数传入。

### 配置相对路径

changelog 配置如果为相对路径为 `.changesets` 目录下的相对路径。

例如创建 `.changeset/my-changelog-config.js` 文件，定义如下内容：

```typescript title=".changeset/my-changelog-config.js"
async function getReleaseLine(changeset, type) {}

async function getDependencyReleaseLine(changesets, dependenciesUpdated) {}

module.exports = {
  getReleaseLine,
  getDependencyReleaseLine,
};

```

`changlog` 配置为 `./my-changelog-config.js` 即可:

```json title=".changesets/config.json"
{
  "changelog": "./my-changelog-config.js",
   ...
}
```

### 使用模块工程方案

自定义 Changelog 还可以使用模块工程方案进行管理，提供通用方案。

#### 使用 `npx @modern-js/create` 创建模块工程方案。

``` md
? 请选择你想创建的工程类型 模块
? 请填写项目名称 custom-changelog
? 请选择开发语言 TS
? 请选择包管理工具 pnpm
? 是否需要调整默认配置? 否
```

#### 实现自定义内容。

```typescript title="src/index.ts"
export async function getReleaseLine() {}

export async function getDependencyReleaseLine() {}
```

#### 将模块发布到 NPM。

#### 在目标仓库根目录安装对应模块，例如 `custom-changelog`。

#### 配置 changeset 的 changelog 配置为包名称。

```json title=".changesets/config.json"
{
  "changelog": "custom-changelog",
   ...
}
```

### 使用 Monorepo 工程方案

如果你当前仓库为 Monorepo 工程方案，可以直接使用模块子项目进行管理。

#### 执行 `pnpm run new` 创建模块子项目。

``` md
? 请选择你想创建的工程类型 模块
? 请填写子项目名称 custom-changelog
? 请填写子项目目录名称 custom-changelog
? 请选择开发语言 TS
? 是否需要调整默认配置? 否
```

#### 实现自定义内容。

```typescript title="src/index.ts"
export async function getReleaseLine() {}

export async function getDependencyReleaseLine() {}
```

#### 在 Monorepo 根目录添加子项目模块依赖，例如 `custom-changelog`。

```json title="package.json"
{
  "devDependencies": {
    "custom-changelog": "workspace: *",
    ...
  }
}
```

#### 配置 changeset 的 changelog 配置为包名称。

```json title=".changesets/config.json"
{
  "changelog": "custom-changelog",
   ...
}
```

该模块发布到 NPM 后，依然可以和模块类型一样供其他仓库使用。
