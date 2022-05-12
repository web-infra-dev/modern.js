---
sidebar_position: 3
---

# 子项目联调

本章将要介绍如何在 Monorepo 下进行子项目之间的联调使用。

## 准备工作

按照 [「创建子项目」](/docs/guides/features/monorepo/create-sub-project) 章节的介绍（如果还没有看过，可以先了解一下），我们首先创建以下三个子项目：

- 一个「应用」子项目
- 一个「模块（内部）」子项目
- 一个「模块」子项目

执行 `pnpm run new`，并按照如下进行选择：

**「应用」子项目：**
```
? 请选择你想创建的工程类型 应用
? 请填写子项目名称 app
? 请填写子项目目录名称 app
? 请选择开发语言 TS
? 是否需要支持以下类型应用 不需要
? 是否需要调整默认配置? 否
```

**「模块（内部）」子项目：**
```
? 请选择你想创建的工程类型 模块（内部）
? 请填写子项目名称 internal-lib
? 请填写子项目目录名称 internal-lib
? 请选择开发语言 TS
? 是否需要调整默认配置? 否
```

**「模块」子项目：**
```
? 请选择你想创建的工程类型 模块
? 请填写子项目名称 components
? 请填写子项目目录名称 components
? 请选择开发语言 TS
? 是否需要调整默认配置? 否
```

创建成功后，会得到以下项目：

- `./apps/app`
- `./packages/components`
- `./features/internal-lib`

然后修改一下默认的代码和新增文件：

**重命名 `./pakcages/components/src/index.tsx`**
``` tsx
import './index.css';

export default function ({ text }: { text: string }) {
  return (
    <div>
      This is UI Components Log: <p className="log">{text}</p>
    </div>
  );
}
```

**新增 `./pakcages/components/src/index.css`**
``` css
.log {
  color: gray;
}
```

**修改 `./features/internal-lib/src/index.ts`**
``` tsx
export default function (text: string) {
  return text.toUpperCase();
}
```

**修改 `./apps/app/src/App.tsx`**
``` tsx
import { Switch, Route } from '@modern-js/runtime/router';
import formatString from 'internal-lib';
import Comp from 'components';

import './App.css';

const App = () => (
  <Switch>
    <Route exact={true} path="/">
      <div className="container-box">
        <Comp text={formatString('hello world')} />
        {/* 省略... */}
      </div>
    </Route>
    <Route path="*">
      <div>404</div>
    </Route>
  </Switch>
);

export default App;
```

到此为止我们创建了一个可以被发布到外部的组件项目、一个转换字符串的内部模块项目以及一个使用组件和内部模块的应用项目，如果直接运行应用项目还暂时无法正常使用。接下来将要介绍如何让它们能够互相联调使用，成功的使应用子项目 `apps/app` 正常运行。

:::info 注
启动 `apps/app` 项目之前需要先构建（`pnpm run build`） `packages/component`。
:::

由于Modern.js 支持 pnpm 与 Yarn 的 Monorepo 工程，接下来会从这两个方面分别介绍。

## 在使用 pnpm 的 Monorepo 中进行项目联调

在 pnpm 的 Monorepo 项目中，我们通过在 `apps/app` 子项目下分别执行：

```
pnpm add components
```

以及

```
pnpm add internal-lib -D
```

:::info 注
注意这里将 internal-lib 作为 `apps/app` 项目的开发依赖，因为在构建环境会被打包到构建产物中。
:::

将 `packages/components` 与 `features/internal-lib` 子项目加入到应用的依赖列表当中。

执行成功后，在 `apps/app/package.json` 会发生如下变化：

``` json
{
  "dependencies": {
++  "components": "workspace:^0.1.0"
  },
  "devDependencies": {
++  "internal-lib": "workspace:^0.1.0"
  },
}
```

:::info 补充信息
`workspace:^0.1.0` 是一种 PNPM 提供的 [Workspace 协议](https://pnpm.io/workspaces#workspace-protocol-workspace)。
:::

当依赖安装成功之后，我们还需要将 `packages/components` 进行构建，因为需要使用其构建产物。

到此为止，`app/apps` 应用子项目可以正常的运行了。在修改 `features/internal-lib` 的源码，或者修改 `packages/components` 的源码并构建之后都会触发应用子项目的热更新。

## 在使用 Yarn 的 Monorepo 中进行项目联调

在 Yarn 的 Monorepo 项目中，默认情况下可以直接在 `apps/app` 应用项目中直接使用组件项目和内部模块项目。

:::info 补充信息
之所以可以直接在应用中使用使用组件项目和内部模块项目，是因为 Yarn 将这些子项目模块提升到了顶层的 `node_modules`内。
:::

但是由于组件 `components` 是非内部模块，因此建议在 `apps/app/package.json` 中进行依赖声明：

``` json
{
  "dependencies": {
++  "components": "0.1.0"
  },
}
```
