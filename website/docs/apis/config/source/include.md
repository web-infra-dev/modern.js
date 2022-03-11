---
sidebar_label: include
sidebar_position: 5
---

# `source.include`

:::info 适用的工程方案
* MWA
:::

* 类型： `Array<string | RegExp>`
* 默认值： `[]`


Modern.js 默认不编译 `node_modules` 下的文件。

通常情况下，这种策略没有问题，但是当项目中使用了只提供 ES6 语法代码的第三方依赖时，可能导致在低版本浏览器上无法运行。

可通过该选项指定需要编译的依赖，提供包名或者正则匹配规则即可。

以 `query-string` 为例，可通过该选项指定 `query-string` 及其内部依赖 `split-on-first`：

```js title="modern.config.js"
export default defineConfig({
  source: {
    include: ['query-string', 'split-on-first']
  }
});
```

:::note 注
使用 Modern.js monorepo 方案时，对于 monorepo 内部的组件库，也可以直接在应用编译的过程中处理这些库的源代码，只需要在这个选项中设置对应的包名即可:

```js title="modern.config.js"
export default defineConfig({
  source: {
    // 设置编译 monorepo 下的 package
    include: ['@custom/package-name'],
  },
});
```
:::



