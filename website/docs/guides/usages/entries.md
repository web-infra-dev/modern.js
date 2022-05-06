---
sidebar_label: 自定义入口和服务器端路由
sidebar_position: 3
---

# 自定义入口和服务器端路由

使用 Modern.js 时，通常情况下是不需要自己指定入口的，框架会根据项目目录结构得到默认的入口。

在一些特殊情况下，例如目录结构有要求时，Modern.js 也提供了自定义入口的方式。

## 默认入口机制

默认会遍历当前项目 `src/` 目录，根据目录结构来判断当前项目是单入口还是多入口。

:::tip 提示
- 可以通过 [`source.entriesDir`](/docs/apis/config/source/entries-dir) 更改入口目录 `src/` 为其他目录。
- 以下内容省略文件后缀，默认支持 js、jsx、ts、tsx。
:::

### 入口特征

入口所在目录必须满足以下三个条件之一：

1. 具有 `App` 文件
2. 具有 `pages` 目录
3. 具有 `index` 文件

三种情况对应的目录结构示例如下：

```bash title="src/App.(j|t)sx?"
├── src
│   ├── common
│   └── App.(j|t)sx?
```

```bash title="src/pages"
├── src
│   ├── common
│   └── pages // pages 目录
```

```bash title="src/index.(j|t)sx?"
├── src
│   ├── common
│   └── index.(j|t)sx?
```

默认会遍历 `src/` 目录以及 `src/` 目录下的二级目录，如 `src/a/`。

:::tip 提示
Modern.js 内置了 "@" 别名，指向 `src` 目录。
:::

### 单入口应用

当 `src/` 目录满足**入口特征**时，Modern.js 会认为当前项目为单入口应用。

:::tip 提示
单入口应用默认入口名为 `main`。
:::

### 多入口应用

当项目不是单入口应用时，Modern.js 会进一步查看 `src` 下的文件夹。

如 `src/a/`，当 `a` 目录符合单入口应用的特征时，会被当做一个入口，对应的入口名为当前目录名。

多个入口之间公用的代码，推荐放到 `src/common/` 目录下，这里就要求 `common` 目录不能满足入口的特征。

例如，目录结构如下时：

```bash
├── src
│   ├── common
│   │   ├── components
│   │   ├── models
│   │   └── utils
│   ├── landing-page
│   │   └── index.js
│   ├── page-1
│   │   ├── components
│   │   ├── models
│   │   └── App.jsx
│   └── page-2
│       ├── components
│       ├── models
│       └── pages // pages 目录
└── package.json
```

会检测出 3 个入口：`landing-page`、`page-1` 和 `page-2`。

:::tip 提示

* 对于多入口应用，入口名和 `package.json` 文件中的 `name` 属性值相同的入口为主入口，访问时可以直接通过 `/` 访问。
* 如上述目录结构，假如 `package.json` 文件中 `name` 属性值为 `page-2`, 则同名入口就可以通过 `http://localhost:8080` 直接访问。

:::

## App、Pages、Index 入口的区别

### App 入口

在 MWA 项目中，推荐入口目录下只放置 `App` 文件，默认导出整个应用的根组件即可，如下:

```js title=src/App.jsx
import React from 'react';

const App = () => {
   return (//...)
};

export default App;
```

当 Modern.js 检测到入口中存在 `App` 文件时，会自动生成真正的 Webpack 入口文件，完成将组件挂载到 DOM 节点等所有工作，大致代码逻辑如下:

```js
import { createApp, bootstrap } from '@modern-js/runtime';
import React from 'react';
import App from 'xxxx/src/App';

const IS_BROWSER = typeof window !== 'undefined';
const MOUNT_ID = 'root';

let AppWrapper = null;

const renderApp = () => {
  AppWrapper = createApp({})(App);

  bootstrap(AppWrapper, MOUNT_ID);
};

renderApp();

export default AppWrapper;

if (IS_BROWSER && module.hot) {
  module.hot.accept('xxxxx/src/App', () => {
    renderApp();
  });
}
```

:::tip 提示

* Modern.js 生成的入口会统一放到  `node_modules/.modern-js/` 目录。对应的 Webpack 入口文件为 `node_module/.modern-js/${entryName}/index.js`。
* `createApp` 和 `bootstrap` 为 `@modern-js/runtime` API，详情请参考：【[Runtime API](/docs/apis/runtime/app/create-app)】。

:::

### Pages 入口

Modern.js 也同样提供了约定式路由，即**文件系统即路由**。

约定式路由详情请参考: 【[使用约定式路由](/docs/guides/tutorials/c08-client-side-routing/8.2-file-based-routing)】。

### Index 入口

通常情况下，上面两种路由已经能够满足需求，当开发者需要在 `bootstrap` 执行之前做些操作或者完全接管 Webpack 入口时，可以在入口目录下放置 `index` 文件。下面对两种情况分别介绍：

1. **bootstrap 之前添加自定义行为**。

  当 `index` 文件默认导出**函数**时，Modern.js 还是会根据 `runtime.features` 的设置情况生成 `createApp` 包裹后的代码。在渲染过程中，将 `createApp` 包裹后的组件作为参数传递给 `index` 文件导出的函数，这样开发者可以自定义将组件挂载到 DOM 节点上。

  例如：

  ```js title=src/index.jsx
  import { bootstrap } from '@modern-js/runtime';

  export default App => {
    // do something before bootstrap...
    bootstrap(App, 'root');
  };
  ```

  Modern.js 生成的文件内容如下：

  ```js
  import customRender from 'xxxx/src/index.js';
  import { createApp, bootstrap } from '@modern-js/runtime';
  import React from 'react';
  import App from 'xxxx/src/App';

  const IS_BROWSER = typeof window !== 'undefined';
  const MOUNT_ID = 'root';

  let AppWrapper = null;

  const renderApp = () => {
    AppWrapper = createApp({
      // runtime 的插件参数...
    })(App);
    customRender(AppWrapper);
  };

  renderApp();

  export default AppWrapper;

  if (IS_BROWSER && module.hot) {
    module.hot.accept('xxx/src/App', () => {
      renderApp();
    });
  }
  ```

2. **完全接管 Webpack 入口**

  当 `index` 文件没有导出函数时，这时候 `index` 文件就是真正的 Webpack 入口文件，这里和 [Create React App](https://github.com/facebook/create-react-app) 类似，需要自己将组件挂载到 DOM 节点、添加热更新代码等。如下:

  ```js title=src/index.jsx
  import React from 'react';
  import ReactDOM from 'react-dom';
  import App from './App';

  ReactDOM.render(<App />, document.getElementById('root'));
  ```

  Modern.js **不推荐**使用这种方式，这种方式丧失了框架的一些能力，如 **`modern.config.js` 文件中的 `runtime` 配置将不会再生效**。

## 如何自定义入口

当项目对目录结构有特殊要求时，可以在 `modern.config.js` 文件中添加配置 `source.entries` 自行配置入口。

### 自定义普通入口

通常情况下，创建的入口需要是 **App 类型**，即指定的入口文件只需要导出应用的根组件。

例如以下目录结构：

```bash
.
├── src
│   └── entry
│       ├── chat.tsx
│       └── home.tsx
└── package.json
```

结合上面【默认入口机制】的内容，Modern.js 在分析上述目录结构时，不会得到任何默认入口。

在不想改变目录结构的情况下（如项目迁移），可以通过 `source.entries` 自定义入口：

```js title="modern.config.js"
export default defineConfig({
  source: {
    entries: {
      home: './src/entry/home.tsx',
      chat: './src/entry/chat.tsx',
    },
  },
})
```

`src/entry/home.tsx` 中只需要导出根组件，此时该文件就会和 `src/App` 等价，Modern.js 会生成真正的 Webpack 入口文件。

### disableMount

在迁移旧项目到 Modern.js 时，可能不需要使用默认生成代码的功能，可以设置 `disableMount` 属性，关闭入口代码生成的功能。

针对上面 `chat` 和 `home` 两个入口的目录结构，当配置如下时：

```js title="modern.config.js"
export default defineConfig({
 source: {
    entries: {
      home: {
        entry: './src/entry/home.tsx',
        disableMount: true, // 禁止生成入口代码
      },
      chat: './src/entry/chat.tsx',
    },
  },
})
```

Modern.js 不会为 `src/entry/home.tsx` 生成额外的入口代码，而是直接把它当做普通的 Webpack 入口文件。此时，用户需要自行处理组件挂载、热更新等问题。

### enableFileSystemRoutes

可以通过该选项指定某个目录使用约定式路由，例如以下目录结构：

```bash
.
├── src
│   └── routes
│       ├── a.jsx
│       ├── b.jsx
│       └── index.js
└── package.json
```

需要在 `routes` 目录开启约定式路由时，配置如下：

```js title="modern.config.js"
export default defineConfig({
 source: {
    entries: {
      routes: {
        entry: './src/routes', // 启用约定式路由时，entry 必须为目录
        enableFileSystemRoutes: true,
      },
    },
  },
})
```

`dev` 命令运行成功后，访问路由与文件对应如下：

* `http://localhost:8080/routes` -> `./src/routes/index.js`
* `http://localhost:8080/routes/a` ->  `./src/routes/a.jsx`
* `http://localhost:8080/routes/b` -> `./src/routes/b.jsx`

:::tip 提示
1. 使用 `enableFileSystemRoutes` 时，`entry` 属性必须为目录。
2. `enableFileSystemRoutes` 不能与 `disableMount` 同时开启。
:::

### 自定义入口和默认入口合并

在指定 `source.entries` 后，Modern.js 会将用户自定义的入口与分析目录结构得到的默认入口合并。合并规则为：

比较自定义入口设置的入口路径和默认入口路径，当入口路径一致时，自定义入口会覆盖默认入口。

例如以下目录结构:

```bash
.
├── src
│   ├── chat
│   │   └── App.jsx
│   └── home
│       └── index.js
└── package.json
```

Modern.js 分析 `src/` 目录，得到默认入口 `chat` 和 `home`。当用户在 `modern.config.js` 文件中配置如下时：

```js title="modern.config.js"
export default defineConfig({
  source: {
    entries: {
      index: './src/home/index.js',
    },
  },
};
```

可以看到自定义入口 `index` 的路径和默认入口 `home` 的路径一致，在合并的过程中，`index` 会覆盖掉 `home`，最终入口如下:

* `chat` -> `./src/chat/App.jsx`
* `index` -> `./src/home/index.js`

需要注意的是 `index` 入口由于没有设置 `disableMount`，所以是会默认生成入口代码。

## 如何修改入口对应的路由

默认情况下，入口名也就是对应的访问路由，当需要修改入口对应的访问路由或者设置多个路由时，可以在 `modern.config.js` 文件中添加 [`server.routes`](/docs/apis/config/server/routes) 配置。
