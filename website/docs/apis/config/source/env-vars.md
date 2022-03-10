---
sidebar_label: envVars
sidebar_position: 2
---

# `source.envVars`

:::info 适用的工程方案
* MWA
* 模块
:::

* 类型： `Array`
* 默认值：
  - MWA 工程方案中: `[NODE_ENV, BUILD_MODE]`
  - 模块工程方案中: 无


支持源代码中在非 Node 环境使用指定的环境变量。

数组中给定环境变量的名字。编译时，会将设置的环境变量对应值注入到业务代码中。

举例如下:

```js title="modern.config.js"
export default defineConfig({
  source: {
    envVars: ['VERSION']
  }
})
```

在业务代码中使用如下:

```js
console.log(process.env.VERSION);
```

:::tip 提示
环境变量的值需要提前设置好，具体设置的方式可以参考：环境变量设置。
:::

:::note 注
`process.env.NODE_ENV` 会根据当前运行的命令设置对应的值：

* `build` 命令执行为 `production`
* `test` 命令执行为 `test`
* 其余情况为 `development`

<!-- 模块工程方案中 `BUILD_FORMAT` 在构建不同代码过程中会有不同的值：

- ESM + (ES6+): `process.env.BUILD_FORMAT === "ESM_ES6"`
- ESM + ES5: `process.env.BUILD_FORMAT === "ESM_ES5"`
- CJS + (ES6+): `process.env.BUILD_FORMAT === "CJS_ES6"` -->
:::
