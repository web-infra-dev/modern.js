---
sidebar_position: 3
---

# 开发中后台

本章将介绍如何使用 Modern.js，进行中后台项目的开发。本章对应的代码仓库地址在[这里查看](https://github.com/modern-js-dev/modern-js-examples/tree/main/quick-start/middle-platform)。

通过本章你可以了解到：

- 如何创建一个中后台项目。
- 如何为项目创建新入口。
- 如何使用客户端路由。
- 如何集成和使用开源组件库。
- 如何开发和使用 BFF API。
- 如何使用 Model 进行状态管理。
- 如何使用测试功能。

:::info 在线预览
在 StackBlitz 中预览：<a alt="StackBlitz" target="\_blank" rel="noopener noreferrer" style={{ verticalAlign: '-5px', marginLeft: '5px' }} href="https://stackblitz.com/edit/modern-js-mwa"><img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" /></a>
:::

## 环境准备

import EnvPrepare from '@site/docs/components/env-prepare.md';

<EnvPrepare />

## 创建项目

使用 `@modern-js/create` 创建新项目，运行命令如下：

```bash
npx @modern-js/create middle-platform
```

:::info 注
`middle-platform` 为创建的项目名。
:::

按照如下选择，生成项目：

```bash
? 请选择你想创建的工程类型： 应用
? 请选择开发语言： TS
? 请选择包管理工具： pnpm
? 是否需要支持以下类型应用： 不需要
? 是否需要调整默认配置： 否
```

## 开发调试

进入项目根目录， 之后执行 `pnpm run dev` 即可启动开发服务器：

```bash
# 进入项目根目录
cd middle-platform

# 启动开发服务器
pnpm run dev
```

浏览器中访问 `http://localhost:8080`，可以看到应用已经正常启动。

修改 `src/App.tsx` 会触发重新编译和热更新，浏览器中页面会自动展示对应变化。

### IDE 支持

import DevIDE from '@site/docs/components/dev-ide.md'

<DevIDE/>

## 创建入口

在 Modern.js 中，一个[入口](/docs/guides/tutorials/c07-app-entry/7.1-intro)，经过构建后会生成一个对应的 HTML 文件。默认生成的项目只包含一个入口。现在，我们创建一个新入口，对应中后台应用的**控制台模块**，而原有入口对应中后台应用的落地页。

在项目根目录下，执行 `pnpm run new`，进行如下选择：

```bash
? 请选择你想要的操作： 创建工程元素
? 创建工程元素： 新建「应用入口」
? 填写入口名称：console
? 是否修改默认的应用入口配置：否
```

创建完成，项目的 `src` 目录下会有两个目录：

```md
.
├── src/
│   ├── console/
│   │   └── App.tsx
│   ├── middle-platform/
│   │   └── App.tsx
│   ├── .eslintrc.json
```

其中，`console/` 目录对应新建的入口，项目默认的入口（主入口）代码被移动到 `middle-platform/` 目录下。

:::info 注
使用生成器将应用从单入口转换成多入口时，原本主入口的代码将会被移动到与当前应用 package.json 同名的目录下。
:::

重新启动应用，控制台会输出不同入口对应的访问地址。默认情况下，主入口对应的访问地址为 **{域名根路径}**，其他入口对应的访问地址为 **{域名根路径}/{入口名称}**，如下所示：

```md
App running at:

  > Local:
    console             http://localhost:8080/console
    middle-platform     http://localhost:8080/
```

:::info 补充信息
如果需要修改入口名和访问地址的映射关系，可以配置【[`server.routes`](/docs/apis/config/server/routes)】。
:::

我们对两个入口的代码做简单修改：

```js title="middle-platform/App.tsx"
import React from 'react';

const App: React.FC = () => (
  <div>
    <div>This is a landing page. </div>
    <a href="/console">Go to console</a>
  </div>
);

export default App;
```

```js title="console/App.tsx"
import React from 'react';

const App: React.FC = () => <div>Console</div>;

export default App;
```

现在，点击落地页上的链接，可以跳转到控制台入口对应的页面。

:::info 补充信息
关于入口的更多介绍，请参考 【[添加应用入口](/docs/guides/tutorials/c07-app-entry/7.1-intro)】。
:::

## 客户端路由

`console` 入口对应中后台应用的控制台模块，控制台模块一般会实现为一个复杂的 SPA 应用，所以需要使用客户端路由。默认生成的项目已经开启客户端路由功能，我们可以直接从 `@modern-js/runtime/router` 包引入路由相关组件。

`console/App.tsx` 的代码如下：

```js {2,10-11,13-20}
import React from 'react';
import { Route, Switch, Link} from '@modern-js/runtime/router';
import Dashboard from './dashboard';
import TableList from './tableList';

const App: React.FC = () => {
  return (
    <div>
      <div>
        <Link to="/">Dashboard</Link> &nbsp;
        <Link to="/table">Table</Link>
      </div>
      <Switch>
        <Route path="/" exact={true}>
          <Dashboard/>
        </Route>
        <Route path="/table">
          <TableList/>
        </Route>
      </Switch>
    </div>
  );
};

export default App;
```

`console/App.tsx` 中 `Dashboard` 和 `TableList` 两个组件，分别定义在 `console/dashboard` 和 `console/tableList` 两个文件夹下，代码如下：

```js title="console/dashboard/index.tsx"
import React from 'react';

const Dashboard: React.FC = () => <div>Dashboard Page</div>;

export default Dashboard;
```

```js title="console/tableList/index.tsx"
import React from 'react';

const TableList: React.FC = () => <div>TableList Page</div>;

export default TableList;
```

此时，点击页面上的两个链接，浏览器地址栏的 URL 发生变化，页面渲染的组件也随之更改，说明客户端路由可以正常工作。

:::info 补充信息
`console/App.tsx` 中客户端路由的使用方式在 Modern.js 中称为**自控式路由**，Modern.js 还支持**约定式路由**，关于路由的详细介绍，请参考【[添加客户端路由](/docs/guides/tutorials/c08-client-side-routing/8.1-code-based-routing)】。
:::

### 代码分片

当前代码在构建后，会把所有路由用到的组件都打包到一个 JS 文件中。打开浏览器开发者工具的 Network 窗口， `console.js` 对应所有路由组件打包后的 JS 文件，如下图所示：

![code-split-1](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/start/code-split-1.png)

我们可以使用 loadable，并根据路由划分，对代码进行分片。

Modern.js 对 loadable 提供了开箱即用的支持，可以直接从 '@modern-js/runtime/loadable' 导出函数，例如：

```js title="console/App.tsx"
import loadable from '@modern-js/runtime/loadable'

const Dashboard = loadable(() => import('./dashboard'));
const TableList = loadable(() => import('./tableList'));

const App: React.FC = () => {
  // ...
};

export default App;
```

此时，切换不同路由，会按需加载对应路由所需要的组件代码。如下图所示：

![code-split-2](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/start/code-split-2.png)

当访问 `/console` 路由时，会加载 `src_console_dashboard_index_tsx.js` 这个文件；当访问 `/console/table` 路由时，会加载 `src_console_tableList_index_tsx.js` 这个文件。

:::info 补充信息
关于 `loadable` 的更多用法，请参考【[loadable API](/docs/apis/runtime/utility/loadable/loadable_)】。
:::

## 集成组件库

中后台项目通常会集成第三方组件库，以提高组件开发效率。这里，我们以 [Ant Design](https://ant.design) 为例，介绍组件库的集成方式。

首先需要安装组件库依赖：

```bash
pnpm add antd
```

然后，在需要使用 Ant Design 的入口文件中引入组件库的样式，这里我们在 `/console/App.tsx` 中引入：

```js
import 'antd/dist/antd.css';
```

这样，我们就可以在任意组件中使用 Ant Design 的组件了。我们在 `TableList` 组件中使用 `Table` 组件：

```js
import React from 'react';
import { Table } from 'antd';

const TableList: React.FC = () => {
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

  const data = [
    {
      key: '1',
      name: 'John Brown',
      age: 32,
      country: 'America',
    },
    {
      key: '2',
      name: 'Jim Green',
      age: 42,
      country: 'England',
    },
    {
      key: '3',
      name: 'Ming Li',
      age: 30,
      country: 'China',
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

此时，访问 `http://localhost:8080/console/table`，可以看到页面上会渲染出 `Table` 组件。

### 按需加载组件样式

直接 `import 'antd/dist/antd.css'` 会将组件库包含的所有组件的样式都引入进来。我们可以借助 [babel-plugin-import](https://github.com/ant-design/babel-plugin-import) 插件，实现组件样式的按需加载。

Modern.js 已经内置了 babel-plugin-import 插件，但因为 Ant Design 使用 Less 编写组件样式，我们还需要开启 Less 支持。

在项目根目录下，执行 `pnpm run new`，进行如下选择：

```bash
? 请选择你想要的操作： 启用可选功能
? 启用可选功能： 启用 Less 支持
```

然后，我们删除 `/console/App.tsx` 中引入 Ant Design 组件库样式的代码。

重新访问 `http://localhost:8080/console/table`，可以看到页面上依然可以渲染出带有样式的 `Table` 组件。查看浏览器开发者工具的 Network 标签，会发现此时加载的 Ant Design 的 CSS 文件体积也变小了。

另外，开启 Less 支持后，我们也可以在单独的样式文件中使用 Less 语法。

:::info 补充信息
关于组件样式的更多用法，请参考【[CSS 开发方案](/docs/guides/usages/css/css-in-js)】。
:::

## 一体化 BFF

当前 Table 组件使用的数据是静态数据，我们现在希望能通过服务端 API 动态获取数据。服务端 API 地址为：<https://lf3-static.bytednsdoc.com/obj/eden-cn/beeh7uvzhq/users.json>。

但这个 API 并不是专门为当前项目提供的，部署也是在一个独立的域名下。

通常情况下，项目需要创建一个和当前项目部署在同一域名下的专属 API，并在这个 API 内部去调用原始数据获取，并进行裁剪聚合等。在前端，这样的需求通常使用 BFF 层来实现。

Modern.js 提供了开箱即用的 BFF 能力，支持和前端代码共同开发、调试、部署。

:::info 注
如果已经具备了为前端项目专门开发的、部署在同域下的 API，则不需要再创建 BFF 层，前端代码直接调用 API 即可。
:::

首先，需要开启 BFF 功能，在项目根目录下，执行 `pnpm run new`，进行如下选择：

import LaunchBFFChoices from '@site/docs/components/launch-bff-choices.md';

<LaunchBFFChoices />

执行完成后，项目中新增了 `api/` 目录，添加在 `api/users.ts` 文件，实现对获取数据 API 的调用（需要先安装 axios 依赖）：

```js
import axios from 'axios';

export default async () => {
  const res = await axios.get<
    { key: string; name: string; age: number; country: string }[]
  >('https://lf3-static.bytednsdoc.com/obj/eden-cn/beeh7uvzhq/users.json');
  return res.data;
};
```

重新执行 `dev` 命令，我们已经可以访问 `http://localhost:8080/api/users`，并成功获取用户数据。

下面，我们来修改 `/console/tableList/index.tsx`，我们可以在组件代码中通过 `axios` 调用 API 获取数据，但是 Modern.js 提供了一种更加简洁的方式，可以像使用函数一样来调用 API，关键代码如下：

```js {1,15}
import users from '@api/users'

interface User {
  key: string;
  name: string;
  age: number;
  country: string
}

const TableList: React.FC  = () => {
  const [data, setData] = useState<User[]>([]);

  useEffect(() => {
    const load = async () => {
      const _data = await users();
      setData(_data);
    }

    load();
  }, [])

  //...
}
```

通过 `import users from '@api/users'` 直接引入 `users` 函数，调用 `users` 函数起到了和调用 `http://localhost:8080/api/users` API 同样的作用，这就是 Modern.js 一体化 BFF 的功能。

:::info 补充信息
更多信息，请参考【[一体化 BFF](/docs/guides/features/server-side/bff/function)】。
:::

### Mock 数据

在 Modern.js 中使用 Mock 功能，只需要在 `config/mock/index.t(j)s` 导出一个包含所有 Mock API 的对象，对象的属性由请求 Method 和 URL 组成，对应的值可以为 Object、Array、Function 类型的数据。

现在我们创建一个 `mockUser` API，代码如下：

```js title="config/mock/index.ts"
export default {
  'GET /api/mockUsers': [
    { key: '1', name: 'Mock Name 1', age: 32, country: 'America' },
    { key: '2', name: 'Mock Name 2', age: 42, country: 'England' },
    { key: '3', name: 'Mock Name 3', age: 30, country: 'China' },
  ],
};
```

访问 `http://localhost:8080/api/mockUsers` 即可获取 Mock API 的数据。

:::caution 注意
Mock API 的优先级高于 BFF API。即，当 Mock API 和 BFF API 重名时，返回 Mock API 的数据。
:::

:::info 补充信息
更多信息，请参考【[调试代理和 Mock](/docs/guides/usages/debug/proxy-and-mock)】。
:::

## 使用 Model

中后台项目往往涉及较复杂的状态管理逻辑，此时可以使用专门的状态管理解决方案，Modern.js 已经集成了主流的状态管理解决方案。下面，我们将 `TableList` 组件中的状态管理逻辑移到单独的状态管理层，即 Model 层。

Model 相关 API 由 `@modern-js/runtime/model` 导出，其中，最常用的 API 是 `model`，用于创建 Model 对象。

我们新建 `console/tableList/models/tableList.ts` 文件，用于管理 `TableList` 组件中的状态：

```js title="console/tableList/models/tableList.ts"
import { model } from '@modern-js/runtime/model';
import users from '@api/users'

type State = {
  // ...
};

export default model<State>('tableList').define({
  state: {
    data: [],
  },
  actions: {
    load: {
      // effects 中的 load 函数 执行成功后，fulfilled 会被调用
      fulfilled(state, payload) {
        state.data = payload;
      },
    }
  },
  effects: {
    // 获取用户列表数据的副作用，内部会调用 actions 中的 load 对象的不同方法
    async load() {
      const data = await users();
      return data;
    },
  },
});
```

将这一个 Model 对象命名为 `tableList`，其中 `state` 对应组件中需要使用的状态，`actions` 和 `effects` 对应状态的读取和修改逻辑。

接下来，我们重构 `console/tableList/index.tsx` 的代码：通过 `tableList.ts` 创建的 Model 对象，获取组件所需要的状态。这里，主要用到 `@modern-js/runtime/model` 提供的 `useModel` API，关键代码如下：

```js title="console/tableList/index.tsx" {3-4,7,10}
import React, { useEffect } from 'react';
import { Table } from 'antd';
import { useModel } from '@modern-js/runtime/model';
import tableListModel from './models/tableList';

const TableList: React.FC = () => {
  const [{ data }, { load }] = useModel(tableListModel);

  useEffect(() => {
    load();
  }, []);

  // ...
};

export default TableList;

```

:::info 补充信息
关于 Model 的详细介绍，请参考【[添加业务模型](/docs/guides/tutorials/c10-model/10.1-application-architecture)】。
:::

## 定制 Web Server

Modern.js 除了支持**一体化 BFF**等基本服务端能力，还支持通过定制 Web Server，实现更复杂的服务端需求，例如用户鉴权等功能。 关于这部分内容，请参考【[定制 Web Server](/docs/guides/features/server-side/web/web-server)】。

## 微前端

当中后台项目越来越复杂后，我们还可以把项目拆分成微前端项目，详细内容请参考【[开发微前端](/docs/start/micro-frontend)】。

## 测试

Modern.js 内置 [Jest](https://jestjs.io/) 、[Testing Library](https://testing-library.com/) 等测试库/框架，提供单元测试、组件/页面集成测试、业务模型 Model 测试等功能。默认情况下，`src/` 目录下文件名匹配规则 `*.test.(t|j)sx?` 的文件都会被识别为测试用例。

使用测试功能，需要先开启该功能。在项目根目录下，执行 `pnpm run new`，进行如下选择：

```bash
? 请选择你想要的操作： 启用可选功能
? 启用可选功能： 启用「单元测试 / 集成测试」功能
```

### 页面集成测试

新建 `src/middle-platform/__tests__/App.test.tsx` 文件，作为主入口页面的测试用例：

```js title="App.test.tsx" {1,6,7}
import { renderApp } from '@modern-js/runtime/testing';
import App from '../App';

describe('main entry', () => {
  it('should have contents', () => {
    const { getByText } = renderApp(<App />);
    expect(getByText('This is a landing page.')).toBeInTheDocument();
  });
});
```

`renderApp` 是 `@modern-js/runtime/testing` 提供的用于测试页面的 API。执行 `pnpm run test`，会运行项目下的所有测试用例。

### Model 测试

新建 `src/console/tableList/models/tableList.test.ts` 文件，作为主入口页面的测试用例，代码如下：

```js title="tableList.test.tsx"
import { createStore } from '@modern-js/runtime/testing';
import tableListModel from './tableList';

jest.mock('@api/users', () => [
  { key: 1, name: 'modernjs', age: 12, country: 'China' },
]);

describe('test model', () => {
  it('basic usage', async () => {
    const store = createStore();

    const [state, { load }] = store.use(tableListModel);

    expect(state.data).toEqual([]);

    await load();

    expect(store.use(tableListModel)[0].data.length).toEqual(1);
  });
});

```

通过 `@modern-js/runtime/testing` 中的 `createStore`，可以创建测试 Model 时所需的 `store`。执行 `pnpm run test`，会运行项目下的所有测试用例。

:::info 补充信息
更多用法，请参考【[Testing API](/docs/apis/runtime/testing/render)】、【[测试 Model](/docs/guides/features/runtime/model/test-model)】。
:::

## 部署

import Deploy from '@site/docs/components/deploy.md';

<Deploy/>
