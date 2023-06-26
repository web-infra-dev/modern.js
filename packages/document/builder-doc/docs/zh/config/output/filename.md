- **类型：**

```ts
type FilenameConfig = {
  js?: string;
  css?: string;
  svg?: string;
  font?: string;
  image?: string;
  media?: string;
};
```

- **默认值：**

```js
// 开发环境
const devDefaultFilename = {
  js: '[name].js',
  css: '[name].css',
  svg: '[name].[contenthash:8].svg',
  font: '[name].[contenthash:8][ext]',
  image: '[name].[contenthash:8][ext]',
  media: '[name].[contenthash:8][ext]',
};

// 生产环境
const prodDefaultFilename = {
  js: '[name].[contenthash:8].js',
  css: '[name].[contenthash:8].css',
  svg: '[name].[contenthash:8].svg',
  font: '[name].[contenthash:8][ext]',
  image: '[name].[contenthash:8][ext]',
  media: '[name].[contenthash:8][ext]',
};
```

设置构建产物的名称。

在生产环境构建后，会自动在文件名中间添加 hash 值，如果不需要添加，可以通过 `output.disableFilenameHash` 配置来禁用该行为。

下面是各个文件类型的说明：

- `js`：表示 JavaScript 文件的名称。
- `css`：表示 CSS 样式文件的名称。
- `svg`：表示 SVG 图片的名称。
- `font`：表示字体文件的名称。
- `image`：表示非 SVG 图片的名称。
- `media`：表示视频等媒体资源的名称。

### 示例

修改 JavaScript 文件的名称为 `[name]_script.js`：

```js
export default {
  output: {
    filename: {
      js:
        process.env.NODE_ENV === 'production'
          ? '[name]_script.[contenthash:8].js'
          : '[name]_script.js',
    },
  },
};
```

:::tip 文件名中的 hash 值
通常来说，我们只会在生产环境下设置文件名的 hash 值（即 `process.env.NODE_ENV === 'production'` 时）。

如果你在开发环境下设置了文件名的 hash，那么可能会导致热更新不生效（尤其是 CSS 文件）。这是因为每次文件内容变化时，都会引起 hash 变化，导致 [mini-css-extract-plugin](https://www.npmjs.com/package/mini-css-extract-plugin) 等工具无法读取到最新的文件内容。
:::

### 异步模块的文件名

当你在代码中通过 dynamic import 的方式引入模块时，该模块会被单独打包成一个文件，它默认的命名规则如下：

- 在开发环境下会基于模块路径生成名称，比如 `dist/static/js/async/src_add_ts.js`。
- 在生产环境下会是一个随机的数字 id，比如 `dist/static/js/async/798.27e3083e.js`，这是为了避免在生产环境中泄露源代码的路径，同时字符数也更少。

```js title="src/index.ts"
const { add } = await import('./add.ts');
```

如果你希望为异步模块指定一个固定的名称，可以通过打包工具提供的 [magic comments](https://webpack.js.org/api/module-methods/#magic-comments) 来实现，通过 `webpackChunkName` 指定模块名称：

```js title="src/index.ts"
const { add } = await import(
  /* webpackChunkName: "my-chunk-name" */ './add.ts'
);
```

通过以上写法指定模块名称后，生成的文件会是 `dist/static/js/async/my-chunk-name.js`。
