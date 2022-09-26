- Type: `Object | Function`
- Default

```js
{
  sourceMap: false,
}
```

你可以通过 `tools.sass` 修改 [sass-loader](https://github.com/webpack-contrib/sass-loader) 的配置。

### 类型

#### Object

当 `tools.sass` 配置为 `Object` 类型时，与默认配置通过 Object.assign 合并。

```js
export default {
  tools: {
    sass: {
      sourceMap: true,
    },
  },
};
```

#### Function

当 `tools.sass` 为 Function 类型时，默认配置作为第一个参数传入，可以直接修改配置对象，也可以返回一个值作为最终结果，第二个参数提供了一些可以直接调用的工具函数：

```js
export default {
  tools: {
    sass(config) {
      // 修改 sourceMap 配置
      config.additionalData = async (content,loaderContext) => {
        // ...
      };
    },
  },
};
```

### 工具函数

#### addExcludes

用来指定 `sass-loader` 不编译哪些文件，例如：

```js
export default {
  tools: {
    sass(config, { addExcludes }) {
      addExcludes(/node_modules/);
    },
  },
};
```
