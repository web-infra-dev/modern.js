---
sidebar_position: 4
title: 开发微前端
---

本章将把[中后台项目](/docs/start/admin)，改造成一个微前端项目。本章对应的代码仓库地址在[这里查看](https://github.com/modern-js-dev/modern-js-examples/tree/main/quick-start/micro-frontend)。

通过本章你可以了解到：

- 如何创建微前端项目的主应用、子应用。
- 微前端项目开发的基本流程。
- 如何调试微前端项目。

## 创建

首先我们先创建三个应用：

- main 主应用
- dashboard 子应用
- table 子应用

### 创建 main 主应用

使用 `@modern-js/create` 创建新项目，运行命令如下：

```bash
npx @modern-js/create@modern-1 main
```

:::info 注
main 为创建的项目名。
:::

按照如下选择，生成项目：

```bash
? 请选择你想创建的工程类型： 应用
? 请选择开发语言： TS
? 请选择包管理工具： pnpm
? 是否需要支持以下类型应用： 不需要
? 是否需要调整默认配置： 否
```

使用 `pnpm new` 选择 `「开启微前端」`

配置 `modern.config.js`：

```js title="modern.config.js"
export default defineConfig({
  runtime: {
    router: true,
    state: true,
    masterApp: {
      manifest: {
        modules: [
          {
            name: 'Dashboard',
            entry: 'http://localhost:8081',
          },
          {
            name: 'TableList',
            entry: 'http://localhost:8082',
          },
        ],
      },
    },
  },
});
```

### 创建 dashboard 子应用

使用 `@modern-js/create` 创建新项目，运行命令如下：

```bash
npx @modern-js/create@modern-1 dashboard
```

:::info 注
dashboard 为创建的项目名。
:::

按照如下选择，生成项目：

```bash
? 请选择你想创建的工程类型： 应用
? 请选择开发语言： TS
? 请选择包管理工具： pnpm
? 是否需要支持以下类型应用： 不需要
? 是否需要调整默认配置： 否
```

使用 `pnpm new` 选择 `「开启微前端」`

配置 `modern.config.js`：

```js title="modern.config.js"
export default defineConfig({
  runtime: {
    router: true,
    state: true,
  },
  deploy: {
    microFrontend: true,
  },
});
```

### 创建 table 子应用

使用 `@modern-js/create` 创建新项目，运行命令如下：

```bash
npx @modern-js/create@modern-1 table
```

:::info 注
table 为创建的项目名。
:::

按照如下选择，生成项目：

```bash
? 请选择你想创建的工程类型： 应用
? 请选择开发语言： TS
? 请选择包管理工具： pnpm
? 是否需要支持以下类型应用： 不需要
? 是否需要调整默认配置： 否
```

使用 `pnpm new` 选择 `「开启微前端」`

配置 `modern.config.js`：

```js title="modern.config.js"
export default defineConfig({
  runtime: {
    router: true,
    state: true,
  },
  deploy: {
    microFrontend: true,
  },
});
```

## 迁移代码

### main

修改 `App.tsx`：

```tsx
import { Switch, Route, Link } from '@modern-js/runtime/router';
import { useModuleApps } from '@modern-js/plugin-garfish';

import './App.css';

const App: React.FC = () => {
  const { Dashboard, TableList } = useModuleApps();

  return (
    <div>
      <div>
        <Link to="/dashboard">Dashboard</Link> &nbsp;
        <Link to="/table">Table</Link>
      </div>
      <Switch>
        <Route path="/dashboard" exact={true}>
          <Dashboard />
        </Route>
        <Route path="/table">
          <TableList />
        </Route>
      </Switch>
    </div>
  );
};

export default App;
```

### dashboard

修改 `App.tsx`：

```tsx
export default () => {
  return <div>Dashboard Page</div>;
};
```

### table

将[开发中后台](/docs/start/admin)中的 console 组件下的代码复制过来。

`console/tableList/models/tableList.tsx` ---> `src/models/tableList.tsx`

```tsx title=src/models/tableList.tsx
import { model } from '@modern-js/runtime/model';

type State = {
  data: {
    key: string;
    name: string;
    age: string;
    country: string;
    archived: boolean;
  }[];
};

export default model<State>('tableList').define({
  state: {
    data: [],
  },
  actions: {
    load: {
      fulfilled(state, payload) {
        state.data = payload;

        return state;
      },
    },
  },
  effects: {
    async load() {
      const data = (
        await fetch(
          'https://lf3-static.bytednsdoc.com/obj/eden-cn/beeh7uvzhq/users.json',
        )
      ).json();
      return data;
    },
  },
});
```

`console/tableList/index.tsx` ---> `src/App.tsx`

```tsx title=src/App.tsx
import React, { useEffect } from 'react';
import { Table } from 'antd';
import { useModel } from '@modern-js/runtime/model';
import tableListModel from './models/tableList';

const TableList: React.FC = () => {
  const [{ data }, { load }] = useModel(tableListModel);

  useEffect(() => {
    load();
  }, []);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
    },
  ];

  return (
    <div>
      <Table columns={columns} dataSource={data} />
    </div>
  );
};

export default TableList;
```

## 调试

分别启动 **main**、**dashboard**、 **table**

- main - `http://localhost:8080`
- dashboard - `http://localhost:8081`
- table - `http://localhost:8082`

访问主应用地址 `http://localhost:8080`，效果如下：

![demo](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/start/micro-frontend-demo.gif)

## Modern.js 微前端和直接使用 Garfish 的区别

使用纯 Garfish API 开发微前端应用时 
- 主应用：
  - 安装 Garfish 依赖并使用 Garfish.run 注册子应用 [参考](https://www.garfishjs.org/api/run)
  - 提供一个常驻的 DOM 节点供子应用挂载 [参考](https://www.garfishjs.org/api/registerApp#domgetter)
- 子应用：
  - 导出 provider [参考](https://www.garfishjs.org/guide/start#2%E5%AF%BC%E5%87%BA-provider-%E5%87%BD%E6%95%B0)
  - 设置应用的 basename [参考](https://www.garfishjs.org/guide/start#3-%E8%AE%BE%E7%BD%AE%E5%BA%94%E7%94%A8%E8%B7%AF%E7%94%B1-basename)

区别于直接使用 Garfish 运行时 API 开发微前端项目，Modern.js 的微前端方案更加开箱即用。
使用 pnpm new 启用微前端模式后会自动在 Modern.js 应用中集成 Garfish 插件，在 Garfish
插件的加持下，你只需要
- 主应用：
  - 配置 runtime.masterApp.apps 参数注册子应用
  - 使用 useModuleApps API 获取子应用实例并在组件中完成渲染
- 子应用：
  - 配置 deploy.microFrontend 
  
所以插件中为你做了如下事情
  - 帮助你通过 Garfish 运行时 API 自动注册子应用（主应用）
  - useModulesApps 函数的返回值提供了一个常驻的 DOM 节点供子应用挂载（主应用）
  - 帮助你正确导出了 provider（子应用）
  - 帮助你正确设置了 basename 给 Modern.js 运行时提供 Router 实例，如果是手动引入的 react-router-dom 那么需要从 App.tsx 的 props 中获取 basename 手动传递给引入的 Router 实例（子应用）

## 部署

:::tip 提示
近期上线，敬请期待。
:::
