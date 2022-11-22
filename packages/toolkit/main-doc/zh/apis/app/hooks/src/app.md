---
title: src/App.[tj]sx, src/[entry]/App.[tj]sx
sidebar_position: 1
---

应用项目无路由或者任意路由的入口标识。

开发单页面应用的场景，推荐 `src` 文件夹下放置 `App.[tj]sx` 导出应用根组件即可，Modern.js 会自动生成真正的构建打包的入口文件, 内容大致如下:

```js
import React from 'react';
import { createApp, bootstrap } from '@modern-js/runtime';
import App from '@_modern_js_src/App';
import { state } from '@modern-js/runtime/plugins';
import { immer, effects, autoActions, devtools } from '@modern-js/runtime/model';

const createStatePlugins = (config) => {
  const plugins = [];
  plugins.push(immer(config['immer']));
  plugins.push(effects(config['effects']));
  plugins.push(autoActions(config['autoActions']));
  plugins.push(devtools(config['devtools']));
  return plugins;
}
let AppWrapper = null;
function render() {
  AppWrapper = createApp({
    plugins: [
     state({...{plugins: createStatePlugins(true)}, ...App?.config?.state}),
    ]
  })(App)
  if (IS_BROWSER) {
    bootstrap(AppWrapper, MOUNT_ID);
  }
  return AppWrapper
}
AppWrapper = render();
export default AppWrapper;;
```

开发多页面应用的场景类似，在入口目录下推荐直接放置 `App.[jt]sx`, 自动生成的构建打包入口文件和单页面应用类似。
