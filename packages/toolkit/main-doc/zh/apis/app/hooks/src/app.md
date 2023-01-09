---
title: App.[tj]sx
sidebar_position: 1
---

应用使用自控路由时的入口标识符。

`App.[tj]sx` 并不是实际的应用入口，Modern.js 会自动生成真正的构建打包的入口文件, 内容大致如下：

```js
import React from 'react';
import { createApp, bootstrap } from '@modern-js/runtime';
// App.[jt]sx
import App from '@_modern_js_src/App';
import { state } from '@modern-js/runtime/plugins';
import {
  immer,
  effects,
  autoActions,
  devtools,
} from '@modern-js/runtime/model';

const createStatePlugins = config => {
  const plugins = [];
  plugins.push(immer(config['immer']));
  plugins.push(effects(config['effects']));
  plugins.push(autoActions(config['autoActions']));
  plugins.push(devtools(config['devtools']));
  return plugins;
};
let AppWrapper = null;
function render() {
  AppWrapper = createApp({
    plugins: [
      state({
        ...{ plugins: createStatePlugins(true) },
        ...App?.config?.state,
      }),
    ],
  })(App);
  if (IS_BROWSER) {
    bootstrap(AppWrapper, MOUNT_ID);
  }
  return AppWrapper;
}
AppWrapper = render();
export default AppWrapper;
```

:::note
在多入口的场景下，每个入口都可以拥有独立的 `App.[jt]sx`，详见[入口](/docs/guides/concept/entries)。
:::
