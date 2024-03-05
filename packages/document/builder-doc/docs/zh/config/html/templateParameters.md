- **类型：** `Object | Function`
- **默认值：**

```ts
type DefaultParameters = {
  mountId: string; // 对应 html.mountId 配置
  entryName: string; // 入口名称
  assetPrefix: string; // 对应 output.assetPrefix 配置
  compilation: webpack.Compilation; // 对应 webpack 的 compilation 对象
  webpackConfig: Configuration; // webpack 配置
  // htmlWebpackPlugin 内置的参数
  // 详见 https://github.com/jantimon/html-webpack-plugin
  htmlWebpackPlugin: {
    tags: object;
    files: object;
    options: object;
  };
};
```

定义 HTML 模板中的参数，对应 [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin) 的 `templateParameters` 配置项。你可以使用配置为对象或者函数。

如果是对象，会和默认参数合并。比如：

```ts
export default {
  html: {
    templateParameters: {
      title: 'My App',
    },
  },
};
```

如果是函数，会传入默认参数，你可以返回一个对象，用于覆盖默认参数。比如：

```ts
export default {
  html: {
    templateParameters(defaultValue, { entryName }) {
      const params = {
        foo: {
          ...defaultValue,
          type: 'Foo',
        },
        bar: {
          ...defaultValue,
          type: 'Bar',
          hello: 'world',
        },
      };
      return params[entryName] || defaultValue;
    },
  },
};
```

详细用法可参考 [Rsbuild - html.templateParameters](https://rsbuild.dev/zh/config/html/template-parameters)。
