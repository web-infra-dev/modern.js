---
sidebar_label: moduleScopes
sidebar_position: 9
---

# `source.moduleScopes`

:::info 适用的工程方案
* MWA
:::

* 类型： `Array<string | Regexp> | Function`
* 默认值： `['./src', /node_modules/, './shared']`
  - 使用 BFF 时，默认值为 `['./src', /node_modules/, './api', './shared']`


默认代码只能从 `src`、`node_modules` 目录里引用。

值为 `Array` 类型时，与内部默认值合并；

值为 `Function` 类型时，内部默认值作为第一个参数传入，可以直接修改数组对象不做返回，也可以返回新的数组作为最终结果。

```js title="modern.config.js"
export default defineConfig({
  source: {
    moduleScopes: (opts) => {
      opts.push('./server')
    }
  }
})
```

以下代码为例, `src/App.tsx` 中导入 `src` 外的模块:

```js title="src/App.tsx"
import a from '../utils/a';
```

在 `dev` 是会有错误提示:

![scopes-error](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/module-scopes-error.png)

通过该选项配置 `utils` 目录即可:

```js title="modern.config.js"
export default defineConfig({
  source: {
    moduleScopes: ['./utils'];
  }
})
```
