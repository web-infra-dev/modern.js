- Type: `Object | Function`
- Default:

```js
const defaultOptions = {
  postcssOptions: {
    plugins: [
      require('postcss-flexbugs-fixes'),
      require('postcss-custom-properties'),
      require('postcss-initial'),
      require('postcss-page-break'),
      require('postcss-font-variant'),
      require('postcss-media-minmax'),
      require('postcss-nesting'),
      require('autoprefixer')({
        flexbox: 'no-2009',
      }),
    ],
    // 取决于生产环境，以及是否设置 `output.disableSourceMap`
    sourceMap: enableSourceMap
  },
};
```

Builder 默认集成 PostCSS，你可以通过 `tools.postcss` 对 [postcss-loader](https://github.com/webpack-contrib/postcss-loader) 进行配置。

### 类型

#### Object

当此值为 Object 类型时，与默认配置通过 Object.assign 合并。比如:

```js
export default {
  tools: {
    postcss: {
      // 由于使用 `Object.assign` 合并，因此默认的 postcssOptions 会被覆盖。
      postcssOptions: {
        plugins: [require('postcss-px-to-viewport')],
      },
    },
  },
};
```

#### Function

值为 Function 类型时，内部默认配置作为第一参数传入，可以直接修改配置对象不做返回，也可以返回一个对象作为最终结果；第二个参数为修改 postcss-loader 配置的工具函数集合。

例如，需要在原有插件的基础上新增一个 PostCSS 插件，在 postcssOptions.plugins 数组中 push 一个新的插件即可：

```ts
export default {
  tools: {
    postcss: opts => {
      opts.postcssOptions.plugins.push(require('postcss-px-to-viewport'));
    },
  },
};
```

需要给 PostCSS 插件传递参数时，可以通过函数参数的形式进行传入：

```js
export default {
  tools: {
    postcss: opts => {
      const viewportPlugin = require('postcss-px-to-viewport')({
        viewportWidth: 375,
      });
      opts.postcssOptions.plugins.push(viewportPlugin);
    },
  },
};
```

`tools.postcss` 可以返回一个配置对象，并完全替换默认配置：

```js

export default {
  tools: {
    postcss: () => {
      return {
        postcssOptions: {
          plugins: [require('postcss-px-to-viewport')],
        },
      };
    },
  },
};
```

### 工具函数

#### addPlugins

用于添加额外的 PostCSS 插件。

```js
export default {
  tools: {
    postcss: (config, { addPlugins }) => {
      // 添加一个插件
      addPlugins(require('postcss-preset-env'));
      // 批量添加插件
      addPlugins([require('postcss-preset-env'), require('postcss-import')]);
    },
  },
};
```
