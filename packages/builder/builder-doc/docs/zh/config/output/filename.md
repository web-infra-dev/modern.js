- **Type**

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

- **Default**

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

其中：

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
