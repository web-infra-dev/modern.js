---
sidebar_position: 9
---

# 开发工具库

本章将介绍如何使用 Modern.js，进行工具库项目的开发。

本章对应的代码仓库地址：[独立项目场景](https://github.com/modern-js-dev/modern-js-examples/tree/main/quick-start/library-project) 、[Monorepo 场景](https://github.com/modern-js-dev/modern-js-examples/tree/main/quick-start/monorepo-library)。

:::info
工具库项目是指开发类似 [Lodash](https://lodash.com/)、JavaScript SDK 等可复用模块的项目。
:::

通过本章你可以了解到：

- 如何创建一个工具库项目。
- 如何在工具库项目中进行测试。
- 如何为工具库项目开启 Storybook 功能并使用它进行调试。
- 如何发布工具库项目。
- 如何将工具库项目迁移到 Monorepo 中。

:::info 在线预览
在 StackBlitz 中预览：<a alt="StackBlitz" target="\_blank" rel="noopener noreferrer" style={{ verticalAlign: '-5px', marginLeft: '5px' }} href="https://stackblitz.com/edit/modern-js-library-project"><img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" /></a>
:::

## 环境准备

import EnvPrepare from '@site/docs/components/env-prepare.md';

<EnvPrepare />

## 创建项目

使用 `@modern-js/create` 创建新项目，运行命令如下：

```bash
npx @modern-js/create library-project
```

:::info 注
library-project 为创建的项目名。
:::

按照如下选择，生成项目：

```bash
? 请选择你想创建的工程类型 模块
? 请填写项目名称 library
? 请选择开发语言 TS
? 请选择包管理工具 pnpm
? 是否需要调整默认配置? 否
```

:::info 注
项目名称为 package.json 中的 `name` 字段值。
:::

### 编写工具函数逻辑

修改 `src/index.ts` 文件，增加工具库函数(以将字符串字母都转为大写为例)：

```ts
export const upperCase = (s: string) => s.toUpperCase();
```

## 测试

修改默认测试文件 `tests/index.test.ts`：

```ts
import { upperCase } from '@/index';

describe('upperCase cases', () => {
  test('upperCase', () => {
    expect(upperCase('abc')).toBe('ABC');
  });
});
```

执行 `test` 命令对工具函数进行测试，命令如下：

```bash
pnpm run test
```

## IDE 支持

import DevIDE from '@site/docs/components/dev-ide.md'

<DevIDE/>

## 启用 Storybook 调试

在项目根目录下，执行 `pnpm run new`，可以开启 Storybook 功能。

```bash
? 请选择你想要的操作 启用可选功能
? 启用可选功能 启用「Storybook」
```

启用成功后，会自动创建 `stories/` 目录，修改 `stories/index.stories.tsx` 文件内容：

```ts
import { useState } from 'react';
import { upperCase } from '@/index';

const Component = () => {
  const [value, setValue] = useState('');
  return (
    <div>
      <input value={value} onChange={e => setValue(e.target.value)} />
      <div>result: {upperCase(value)}</div>
    </div>
  );
};

export const YourStory = () => <Component />;

export default {
  title: 'Your Stories',
};
```

执行 `pnpm run dev` 调试运行结果，如下图所示：

![调试 storybook](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/start/storybook.png)

## 产物模式

工具库项目支持配置不同的产物模式来满足不同的开发需求，产物模式通过 `output.packageMode` 配置进行。

该配置支持如下值：

- universal-js
- universal-js-lite
- browser-js
- browser-js-lite
- node-js

具体每个值对应的产物结构详见 [`output.packageMode`](/docs/apis/config/output/package-mode)。

对于当前场景，如果开发的工具库只支持 Node.js 环境，可以在项目 `modern.config.js` 中增加如下配置：

```js title="modern.config.js"
export default defineConfig({
  output: {
    packageMode: 'node-js',
  },
});
```

执行 `pnpm run build` 之后，查看 `dist/` 目录产物，可以看到只生成 `node` 和 `modern` 两种类型的产物。

## 发布

开发完成后，可以对工具库进行发布。

发布分以下四个步骤：

1. 添加 changeset

  执行 `pnpm run change`，根据提示选择升级的版本，并填写变更信息。

![填写变更信息](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/start/changeset.png)

2. 升级对应版本号，并生成 changelog

  执行 `pnpm run bump`，该命令会根据上述生成的 changeset 自动更新版本号和 CHANGELOG 信息，检查信息无误后提交。

3. 发布

  执行 `pnpm run release`， 发布该工具包。

4. 推送 tags

  发布完成之后执行 `git push --follow-tags`，推送当前发布对应生成的 git tag。

## 迁移到 Monorepo

在团队协作开发中，也会存在使用 Monorepo 进行项目开发的情况。接下来介绍如何将工具库项目迁移到 Monorepo 中。

### 创建 Monorepo

使用 `@modern-js/create` 创建 Monorepo 项目，运行命令如下：

```bash
npx @modern-js/create library-monorepo
```

:::info 注
library-monorepo 既是创建的 Monorepo 目录名称，又是项目的名称。
:::

按照如下选择，生成项目：

```bash
? 请选择你想创建的工程类型 Monorepo
? 请选择包管理工具 pnpm
```

生成的项目目录结构如下：

```bash
.
├── .changeset
│   └── config.json
├── .editorconfig
├── .gitignore
├── .npmrc
├── .nvmrc
├── .pnpmfile.cjs
├── .vscode
│   ├── extensions.json
│   └── settings.json
├── README.md
├── apps
│   └── .gitkeep
├── features
│   └── .gitkeep
├── monorepo.code-workspace
├── package.json
├── packages
│   └── .gitkeep
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── tsconfig.json
```

### 迁移工具库项目

这里只需要将之前创建的工具库项目复制到 `packages/` 目录下面，并删除 `.change`、`.vscode`、`.git` 目录及 `.editorconfig`、`.gitignore`、`.nvmrc`、`.npmrc` 文件。

```md
.
├── packages/
│   └── library-project
        ├── CHANGELOG.md
        ├── README.md
        ├── modern.config.js
        ├── package.json
        ├── src
        │   ├── index.ts
        │   └── modern-app-env.d.ts
        ├── stories
        │   ├── index.stories.tsx
        │   └── tsconfig.json
        ├── tests
        │   ├── index.test.ts
        │   ├── modern-app-env.d.ts
        │   └── tsconfig.json
        └── tsconfig.json
| ...
```

### 创建子项目

Modern.js 支持 Monorepo 工程方案的管理，我们可以在 Monorepo 项目下通过 `new` 命令创建不同类型的子项目。例如在刚刚创建的 Monorepo 项目根目录下执行 `pnpm run new`：

然后分别选择创建**应用**，**模块（内部）**项目。

```bash
? 请选择你想创建的工程类型 应用
? 请填写子项目名称 app
? 请填写子项目目录名称 app
? 请选择开发语言 TS
? 是否需要支持以下类型应用 不需要
? 是否需要调整默认配置? 否
```

```bash
? 请选择你想创建的工程类型 模块（内部）
? 请填写子项目名称 internal-lib
? 请填写子项目目录名称 internal-lib
? 请选择开发语言 TS
? 是否需要调整默认配置? 否
```

### 在应用项目中使用组件以及内部模块

接下来在 app 项目中通过以下方式把工具库项目加到依赖中：

```bash
cd ./apps/app
pnpm add library
```

此时可以观察到 app 项目的 `package.json` 内容更新如下：

```json
{
  "dependencies": {
    "@modern-js/runtime": "^1",
++  "library": "workspace:^0.1.1",
    "react": "^17.0.1",
    "react-dom": "^17.0.1"
  }
}
```

接下来导入内部模块 `internal-lib`，由于内部模块并不需要进行发布，因此通过如下方式添加到项目中：

:::info 注
内部模块是指不需要发布到 npm 上的 package，它们只提供源码给应用项目使用，应用项目会将它们打包到构建产物中。
:::

```bash
cd ./apps/app
pnpm add internal-lib -D
```

此时可以观察到 app 项目的 `package.json` 内容更新如下：

```json
{
  "devDependencies": {
    "@modern-js/app-tools": "^1",
    "@types/jest": "^27",
    "@types/node": "^14",
    "@types/react": "^17",
    "@types/react-dom": "^17",
++  "internal-lib": "workspace:^0.1.0",
    "typescript": "^4"
  },
}
```

此时在 app 项目下的 `src/App.tsx` 文件引用 `library` 的 `upperCase` 函数以及 `internal-lib` 模块，并使用它们：

```tsx title="App.tsx"
import { Switch, Route } from '@modern-js/runtime/router';
import { upperCase } from 'library';
import sayHelloWorld from 'internal-lib';

import './App.css';

const App = () => (
  <Switch>
    <Route exact={true} path="/">
      <div className="container-box">
        <main>{/* //... */}</main>
        <div>{upperCase('abc')}</div>
        <div>{sayHelloWorld()}</div>
        <footer className="footer">
          <a href="#" target="_blank" rel="noopener noreferrer">
            Powered by Modern.JS
          </a>
        </footer>
      </div>
    </Route>
    <Route path="*">
      <div>404</div>
    </Route>
  </Switch>
);

export default App;
```

然后我们在 `apps/app` 目录下执行 `pnpm run dev` 命令，可以看到页面渲染效果如下：

![app-tools](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/start/app-tools.png)

### 批量发布

我们可以在 Monorepo 中再创建一个工具库项目(以将字符串字母都转为小写为例)：

在 Monorepo 项目根目录下执行：

```bash
pnpm run new
```

```bash
? 请选择你想创建的工程类型 模块
? 请填写子项目名称 library2
? 请填写子项目目录名称 library2
? 请选择开发语言 TS
? 是否需要调整默认配置? 否
```

修改 `packages/library2/src/index.ts` 文件，增加工具库函数:

```ts
export const lowerCase = (s: string) => s.toLowerCase();
```

开发完成后可以在 Monorepo 的场景下对所有工具库做批量发布：

1. 添加 changeset

在 Monorepo 根目录执行 pnpm run change，根据提示选择发布的包(注意这里只选择工具库包名)和升级的版本，并填写变更信息。

![monorepo 添加 changeset](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/start/monorepo-changeset.png)

2. 升级发布包对应版本号，并生成 changelog

执行 `pnpm run bump`，该命令会根据上述生成的 changeset 自动更新版本号和 CHANGELOG 信息，检查信息无误后提交。

3. 发布

执行 `pnpm run release`， 发布对应的多个工具包。

4. 推送 tags

发布完成之后执行 `git push --follow-tags`，推送当前发布对应生成的 git tag。
