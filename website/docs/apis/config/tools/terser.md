---
sidebar_label: terser
---

# `tools.terser`

:::info 适用的工程方案
* MWA
:::

* 类型： `Object | Function`
* 默认值：见下方配置详情。

<details>
  <summary>terser 配置详情</summary>

```js
  terserOptions: {
    parse: {
      ecma: 8,
    },
    compress: {
      ecma: 5,
      warnings: false,
      comparisons: false,
      inline: 2,
    },
    mangle: {
      safari10: true,
    },
    keep_classnames: isEnvProductionProfile,
    keep_fnames: isEnvProductionProfile,
    output: {
      ecma: 5,
      comments: false,
      ascii_only: true,
    },
  },
  parallel: true,
  // Enable file caching
  cache: true,
  sourceMap: true // 设置 output.disableSourceMap 后为false
  }
```

:::tip 提示
更多关于：<a href="https://github.com/webpack-contrib/terser-webpack-plugin#options" target="_blank">terser 配置</a>。
:::
</details>

对应 [terser-webpack-plugin](https://github.com/webpack-contrib/terser-webpack-plugin) 的配置，值为 `Object` 类型时，与默认配置通过 `Object.assign` 合并，例如生产环境下去除 console：


```js title="modern.config.js"
export default defineConfig({
  tools: {
    terser: {
      terserOptions: {
        compress: {
          drop_console: true,
        }
      },
    }
  }
});
```

值为 `Function` 类型时，默认配置作为第一个参数传入，可以直接修改配置对象不做返回，也可以返回一个值最为最终结果：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    terser: opts => {
      opts.terserOptions.compress.drop_console = true;
    }
  }
});
```
