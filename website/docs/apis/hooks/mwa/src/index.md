---
title: src/index.[tj]s, src/[entry]/index.[tj]s
sidebar_position: 3
---

应用项目自定义路由入口标识。

通常情况下 [`src/App.[tj]sx, src/[entry]/App.[tj]sx`](/docs/apis/hooks/mwa/src/app) 钩子文件已经能满足我们的需求，当我们需要在 `bootstrap` 之前添加自定义行为或者完全接管 webpack 打包入口时，可以在 `src` 或者入口目录下放置 `index.[tj]s`。 下面有分两种情况进行讨论:

1. bootstrap 之前添加自定义行为：

只需要 `src/index.[tj]s` 默认导出函数:

```js title=src/index.js
import { bootstrap } from '@modern-js/runtime';

export default App => {
  // do something before bootstrap...
  bootstrap(App, 'root');
};
```


2. 完全接管 webpack 入口:

当 `src/index.[tj]sx?` 下没有默认导出函数时，该文件即为真正的 webpack 打包入口文件, 可以直接像使用 create-react-app 等脚手架一样组织代码:


```js title=src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));
```
