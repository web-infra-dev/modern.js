---
title: App.[tj]sx
sidebar_position: 1
---

Entry identifier if App want control route by code.

`App.[tj]sx` is not the actual App entry, Modern.js will auto generate the entry file, the content is roughly as follows:

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
In multi-entry App，each entry can have a `App.[jt]sx`, for detail, see [Entry](/docs/guides/concept/entries).
:::
