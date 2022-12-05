---
title: 自定义 App
sidebar_position: 7
---

在[入口](/docs/guides/concept/entries)概念中提到， Modern.js 提供了三种文件约定来标记入口。

通常情况下，`routes/` 与 `App.[jt]sx` 两种模式已经能够满足需求。当开发者需要在根组件挂载前做些操作，或者完全接管 Webpack 入口时，可以在入口目录下放置 `index.[jt]sx` 文件，我们称为**自定义 App**。

## 添加自定义行为

当 `index` 文件默认导出**函数**是，Modern.js 还是会根据 `runtime` 的设置情况生成 `createApp` 包裹后的代码。在渲染过程中，将 `createApp` 包裹后的组件作为参数传递给 `index` 文件导出的函数，这样开发者可以自定义将组件挂载到 DOM 节点上，或在挂载前添加自定义行为。例如：

```js title=src/index.jsx
import ReactDOM from 'react-dom/client'
import { bootstrap } from '@modern-js/runtime';


export default App => {
  // do something before bootstrap...
  bootstrap(App, 'root', undefined, ReactDOM);
};
```

:::warning
由于 bootstrap 函数需要兼容 React17 和 React18 的用法，调用 bootstrap 函数时需要手动传入 ReactDOM 参数。
:::

Modern.js 生成的文件内容如下：

```js
import customRender from '@/src/index.js';
import { createApp, bootstrap } from '@modern-js/runtime';
import React from 'react';
import App from '@/src/App';

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
  module.hot.accept('<path>/src/App', () => {
    renderApp();
  });
}
```

## 完全接管 Webpack 入口

当 `index.[jt]sx` 文件没有导出函数时，这时候该文件就是真正的 Webpack 入口文件。这里和 [Create React App](https://github.com/facebook/create-react-app) 类似，需要自己将组件挂载到 DOM 节点、添加热更新代码等。例如:

```js title=src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));
```

Modern.js **不推荐**使用这种方式，这种方式丧失了框架的一些能力，如 **`modern.config.js` 文件中的 `runtime` 配置将不会再生效**。
