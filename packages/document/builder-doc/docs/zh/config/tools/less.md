- **类型：** `Object | Function`
- **默认值：**

```js
const defaultOptions = {
  lessOptions: {
    javascriptEnabled: true,
  },
  // 默认在开发环境下启用 CSS 的 Source Map
  sourceMap: isDev,
};
```

你可以通过 `tools.less` 修改 [less-loader](https://github.com/webpack-contrib/less-loader) 的配置。

### Object 类型

当 `tools.less` 的值为 `Object` 类型时，会与默认配置通过 Object.assign 进行浅层合并，值得注意的是，`lessOptions` 会通过 deepMerge 进行深层合并。

```js
export default {
  tools: {
    less: {
      lessOptions: {
        javascriptEnabled: false,
      },
    },
  },
};
```

### Function 类型

当 `tools.less` 为 Function 类型时，默认配置作为第一个参数传入，可以直接修改配置对象，也可以返回一个值作为最终结果，第二个参数提供了一些可以直接调用的工具函数：

```js
export default {
  tools: {
    less(config) {
      // 修改 lessOptions 配置
      config.lessOptions = {
        javascriptEnabled: false,
      };
    },
  },
};
```

### 修改 Less 版本

在某些场景下，如果你需要使用特定的 Less 版本，而不是使用 Builder 内置的 Less v4，可以在项目中安装需要使用的 Less 版本，并通过 `less-loader` 的 `implementation` 选项设置。

```js
export default {
  tools: {
    less: {
      implementation: require('less'),
    },
  },
};
```

### 工具函数

#### addExcludes

- **类型：** `(excludes: RegExp | RegExp[]) => void`

用来指定 `less-loader` 不编译哪些文件，你可以传入一个或多个正则表达式来匹配 less 文件的路径。例如：

```js
export default {
  tools: {
    less(config, { addExcludes }) {
      addExcludes(/node_modules/);
    },
  },
};
```
