---
sidebar_label: alias
sidebar_position: 1
---

# source.alias

:::info 适用的工程方案
* MWA
* 模块
:::

* 类型： `Object|Function`
* 默认值：见下方配置详情。

<details>
  <summary>alias 配置详情</summary>

```js
  {
    '@': './src',
    '@shared': './shared',
  }
```
</details>

Modern.js 支持在 JS 和 CSS 中通过别名引用具体路径。通过该选项可以自定义项目下的别名配置。

:::tip 提示
TypeScript 项目只需要配置 [compilerOptions.paths](https://www.typescriptlang.org/tsconfig#paths)。
:::

值为 `Object` 类型时，会与默认值合并:

```js title="modern.config.js"
export default defineConfig({
  source: {
    alias: {
      '@common': './src/common',
    },
  },
});
```

代码中 `import('@common/A.jsx')`, 实际为： `import ('/${appDirectory}/src/common/A.jsx')`。



值为 `Function` 类型时，内部默认配置会作为第一个参数传入。

可以直接修改默认配置，或者返回一个新的对象作为最终结果：

```js title="modern.config.js"
export default defineConfig({
  source: {
    alias: opts => {
      opts['@common'] = './src/common';
    },
  },
});
```

