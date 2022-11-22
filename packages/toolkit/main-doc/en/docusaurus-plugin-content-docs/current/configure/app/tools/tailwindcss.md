---
title: tools.tailwindcss

sidebar_label: tailwindcss
---

* Type: `Object | Function`
* Default: See configuration details below.

<details>
  <summary>TailwindCSS configuration details</summary>

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

:::tip Tips
More about: <a href="https://tailwindcss.com/docs/configuration" target="_blank">TailwindCSS configuration</a>。
:::
</details>

When the value is of type `Object`, rhe configuration corresponding to [TailwindCSS](https://tailwindcss.com/docs/configuration) is merged with the default configuration through `Object.assign`.

When the value is of type `Function`, the object returned by the function is merged with the default configuration by `Object.assign`.

The `theme` attribute is not allowed, otherwise the build will fail. Modern.js use [`source.designSystem`(/docs/configure/app/source/design-system)] as the Tailwind CSS Theme configuration.

Other uses are consistent with [Tailwind CSS](https://tailwindcss.com/docs/configuration)。
