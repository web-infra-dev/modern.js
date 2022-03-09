---
sidebar_label: lodash
---

# `tools.lodash`

:::info 适用的工程方案
* MWA
* 模块
:::

* 类型： `Object | Function`
* 默认值： `{ id: [ 'lodash', 'ramda' ] }`


对应 [babel-plugin-lodash](https://github.com/lodash/babel-plugin-lodash) 的配置，
值为 `Object` 类型时，与默认配置通过 `Object.assign` 合并:


```javascript title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  tools: {
    lodash: {}
  }
});
```

值为 `Function` 类型时，默认配置作为参数传入，可以直接修改配置对象，也可以返回一个对象作为最终配置。

```javascript title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  tools: {
    lodash: opts => {},
  },
});
```
