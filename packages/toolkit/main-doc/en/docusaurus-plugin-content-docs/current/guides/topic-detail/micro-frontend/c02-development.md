---
sidebar_position: 2
title: 体验微前端
---

通过本章你可以了解到：

- 如何创建微前端项目的主应用、子应用。
- 微前端项目开发的基本流程。

## 创建应用

在这次的实践中，我们需要创建三个应用，分别为 1 个主应用，2 个子应用：

- main 主应用
- dashboard 子应用
- table 子应用

### 创建 main 主应用

通过命令行工具初始化项目：

```bash
mkdir main && cd main
npx @modern-js/create
```

import DefaultMWAGenerate from '@site-docs/components/default-mwa-generate.md';

<DefaultMWAGenerate />

完成项目创建后我们可以通过 `pnpm run new` 来开启 `微前端` 功能：

```bash
? 请选择你想要的操作 启用可选功能
? 启用可选功能 启用「微前端」模式
```

接下来，让我们注册微前端插件并添加开启微前端主应用，并增加子应用列表：

import EnableMicroFrontend from '@site-docs/components/enable-micro-frontend.md';

<EnableMicroFrontend />

import MicroRuntimeConfig from '@site-docs/components/micro-runtime-config.md';

<MicroRuntimeConfig />

### 创建 dashboard 子应用

通过命令行工具初始化项目：

```bash
mkdir dashboard && cd dashboard
npx @modern-js/create
```

按照如下选择，生成项目：

<DefaultMWAGenerate/>

我们执行 `pnpm run new` 来开启 `微前端` 功能：

```bash
? 请选择你想要的操作 启用可选功能
? 启用可选功能 启用「微前端」模式
```

接下来，让我们注册微前端插件并修改 `modern.config.ts`，添加微前端子应用的配置 `deploy.microFrontend`：

```js title="modern.config.ts"
import appTools, { defineConfig } from '@modern-js/app-tools';
import garfishPlugin from '@modern-js/plugin-garfish';

export default defineConfig({
  runtime: {
    router: true,
    state: true,
  },
  deploy: {
    microFrontend: true,
  },
  plugins: [appTools(), garfishPlugin()],
});
```

### 创建 table 子应用

通过命令行工具初始化项目：

```bash
mkdir table && cd table
npx @modern-js/create
```

按照如下选择，生成项目：

<DefaultMWAGenerate/>

我们执行 `pnpm run new` 来开启 `微前端`：

```bash
? 请选择你想要的操作 启用可选功能
? 启用可选功能 启用「微前端」模式
```

接下来，让我们注册微前端插件并修改 `modern.config.ts`，添加微前端子应用的配置 `deploy.microFrontend`：

```js title="modern.config.ts"
import appTools, { defineConfig } from '@modern-js/app-tools';
import garfishPlugin from '@modern-js/plugin-garfish';

export default defineConfig({
  runtime: {
    router: true,
    state: true,
  },
  deploy: {
    microFrontend: true,
  },
  plugins: [appTools(), garfishPlugin()],
});
```

## 添加代码

### main 主应用

删除 `src/routers` 目录, 创建 `src/App.tsx`，并添加如下内容：

```tsx
import { Link } from '@modern-js/runtime/router';
import { useModuleApps } from '@modern-js/plugin-garfish/runtime';

const App = () => {
  const { DashBoard, TableList } = useModuleApps();
  return (
    <div>
      <div>
        <Link to="/dashboard">Dashboard</Link> &nbsp;
        <Link to="/table">Table</Link>
      </div>
      <Route path="/dashboard">
        <DashBoard />
      </Route>
      <Route path="/table">
        <TableList />
      </Route>
    </div>
  );
};

export default App;
```

### dashboard 子应用

删除 `src/routers` 目录, 创建 `src/App.tsx`，并添加如下内容：

```tsx
export default () => <div>Dashboard Page</div>;
```

### table 子应用

删除 `src/routers` 目录, 创建 `src/App.tsx`，并添加如下内容：

```tsx
export default () => <div>Table Page</div>;
```

## 调试

按顺序在 `main`、 `dashboard`、 `table` 目录执行 `pnpm run dev` 命令启动应用：

- main      - `http://localhost:8080`
- dashboard - `http://localhost:8081`
- table     - `http://localhost:8082`

访问主应用地址 `http://localhost:8080`，效果如下：

![demo](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/micro-demo.gif)

在完成了微前端整体开发流程的体验后，你可以进一步了解如何 [开发主应用](./c03-main-app.md)

## 常见问题

自查手册: https://www.garfishjs.org/issues/
