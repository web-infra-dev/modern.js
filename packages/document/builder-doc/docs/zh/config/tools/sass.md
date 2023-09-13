- **类型：** `Object | Function`
- **默认值：**

```js
const defaultOptions = {
  // 默认在开发环境下启用 CSS 的 Source Map
  sourceMap: isDev,
};
```

你可以通过 `tools.sass` 修改 [sass-loader](https://github.com/webpack-contrib/sass-loader) 的配置。

### Object 类型

当 `tools.sass` 的值为 `Object` 类型时，会与默认配置通过 Object.assign 进行浅层合并，值得注意的是，`sassOptions` 会通过 deepMerge 进行深层合并。

```js
export default {
  tools: {
    sass: {
      sourceMap: true,
    },
  },
};
```

### Function 类型

当 `tools.sass` 为 Function 类型时，默认配置作为第一个参数传入，可以直接修改配置对象，也可以返回一个值作为最终结果，第二个参数提供了一些可以直接调用的工具函数：

```js
export default {
  tools: {
    sass(config) {
      // 修改 sourceMap 配置
      config.additionalData = async (content, loaderContext) => {
        // ...
      };
    },
  },
};
```

### 修改 Sass 版本

在某些场景下，如果你需要使用特定的 Sass 版本，而不是使用 Builder 内置的 Dart Sass v1，可以在项目中安装需要使用的 Sass 版本，并通过 `sass-loader` 的 `implementation` 选项设置。

```js
export default {
  tools: {
    sass: {
      implementation: require('sass'),
    },
  },
};
```

### 工具函数

#### addExcludes

- **类型：** `(excludes: RegExp | RegExp[]) => void`

用来指定 `sass-loader` 不编译哪些文件，你可以传入一个或多个正则表达式来匹配 sass 文件的路径。例如：

```js
export default {
  tools: {
    sass(config, { addExcludes }) {
      addExcludes(/node_modules/);
    },
  },
};
```
