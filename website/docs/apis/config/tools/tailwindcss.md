---
sidebar_label: tailwindcss
---

# tools.tailwindcss

:::info 适用的工程方案
* MWA
* 模块
:::

* 类型： `Object | Function`
* 默认值：见下方配置详情。

<details>
  <summary>TailwindCSS 配置详情</summary>

```js
  const tailwind = {
    purge: {
        enabled: options.env === 'production',
        content: [
          './config/html/**/*.html',
          './config/html/**/*.ejs',
          './config/html/**/*.hbs',
          './src/**/*',
        ],
        layers: ['utilities'],
    },
    // https://tailwindcss.com/docs/upcoming-changes
    future: {
      removeDeprecatedGapUtilities: false,
      purgeLayersByDefault: true,
      defaultLineHeights: false,
      standardFontWeights: false,
    },
    theme: source.designSystem // 使用source.designSystem配置作为Tailwind CSS Theme配置
  }
```

:::tip 提示
更多关于：<a href="https://tailwindcss.com/docs/configuration" target="_blank">TailwindCSS 配置</a>。
:::
</details>

对应 [TailwindCSS](https://tailwindcss.com/docs/configuration) 的配置，值为 `Object` 类型时，与默认配置通过 `Object.assign` 合并。

值为 `Function` 类型时，函数返回的对象与默认配置通过 `Object.assign` 合并。

不允许出现 `theme` 属性，否则会构建失败。 Modern.js 使用 [`source.designSystem`](/docs/apis/config/source/design-system) 作为 `Tailwind CSS Theme` 配置。

其他的使用方式和 Tailwind CSS 一致: [快速传送门](https://tailwindcss.com/docs/configuration)。
