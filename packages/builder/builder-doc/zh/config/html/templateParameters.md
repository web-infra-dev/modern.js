- Type: `Object | Function`
- Default:

```ts
type DefaultParameters = {
  meta: string; // 对应 html.meta 配置
  title: string; // 对应 html.title 配置
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
    templateParameters: (defaultParameters) => {
      console.log(defaultParameters.compilation);
      console.log(defaultParameters.title);
      return {
        title: 'My App',
      };
    },
  },
};
```

#### 示例

如果需要在 HTML 模板中使用 `foo` 参数，可以添加如下设置：

```js
export default {
  html: {
    templateParameters: {
      foo: 'bar',
    },
  },
};
```

或者使用函数配置：

```js
export default {
  html: {
    templateParameters: (defaultParameters) => {
      return {
        foo: 'bar',
      };
    },
  },
};
```

接下来，你可以在 HTML 模板中，通过 `<%= foo %>` 来读取参数：

```js
<script>window.foo = '<%= foo %>'</script>
```

经过编译后的最终 HTML 代码如下：

```js
<script>window.foo = 'bar'</script>
```
