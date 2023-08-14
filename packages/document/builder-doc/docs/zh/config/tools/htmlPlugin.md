- **类型：** `false | Object | Function`
- **默认值：**

```js
const defaultHtmlPluginOptions = {
  inject, // 对应 html.inject 配置项
  favicon, // 对应 html.favicon 配置项
  filename, // 基于 output.distPath 和 entryName 生成
  template, // 默认为内置的 HTML 模板路径
  templateParameters, // 对应 html.templateParameters 配置项
  chunks: [entryName],
  minify: {
    removeComments: true,
    useShortDoctype: true,
    keepClosingSlash: true,
    collapseWhitespace: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    removeEmptyAttributes: true,
    minifyJS: true,
    minifyCSS: true,
    minifyURLs: true,
  },
};
```

通过 `tools.htmlPlugin` 可以修改 [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin) 或 [@rspack/plugin-html](https://github.com/web-infra-dev/rspack/tree/main/packages/rspack-plugin-html) 的配置项。

### Object 类型

当 `tools.htmlPlugin` 的值为 `Object` 类型时，会与默认配置通过 `Object.assign` 合并。

```js
export default {
  tools: {
    htmlPlugin: {
      scriptLoading: 'blocking',
    },
  },
};
```

### Function 类型

当 `tools.htmlPlugin` 为 Function 类型时：

- 第一个参数是默认配置的对象，可以直接修改该对象。
- 第二个参数是也是一个对象，包含了 entry 的名称和 entry 的值。
- 函数可以 return 一个新的对象作为最终的配置。

```js
export default {
  tools: {
    htmlPlugin(config, { entryName, entryValue }) {
      if (entryName === 'main') {
        config.scriptLoading = 'blocking';
      }
    },
  },
};
```

### Boolean 类型

将 `tools.htmlPlugin` 配置为 `false`，可以禁用默认的 `html-webpack-plugin` 插件。

```js
export default {
  tools: {
    htmlPlugin: false,
  },
};
```

### 禁用 JS / CSS 压缩

默认情况下，Builder 会压缩 HTML 内的 JavaScript / CSS 代码，以优化产物体积。此能力通常在使用自定义模版或插入自定义脚本时会有帮助。然而，当开启 `output.enableInlineScripts` 或 `output.enableInlineStyles` 时，会出现对 inline JavaScript / CSS 代码重复压缩的情况，对构建性能会有一定影响。你可以通过修改 `tools.htmlPlugin.minify` 配置项来修改默认的压缩行为。

```js
export default {
  tools: {
    htmlPlugin: config => {
      if (typeof config.minify === 'object') {
        config.minify.minifyJS = false;
        config.minify.minifyCSS = false;
      }
    },
  },
};
```
