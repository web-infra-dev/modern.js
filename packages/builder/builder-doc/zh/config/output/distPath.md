- **Type**

```ts
type DistPathConfig = {
  root?: string;
  js?: string;
  css?: string;
  svg?: string;
  font?: string;
  html?: string;
  image?: string;
  media?: string;
  server?: string;
};
```

- **Default**

```js
const defaultDistPath = {
  root: 'dist',
  html: 'html',
  js: 'static/js',
  css: 'static/css',
  svg: 'static/svg',
  font: 'static/font',
  image: 'static/image',
  media: 'static/media',
  server: 'bundles',
};
```

设置构建产物的输出目录，Builder 会根据产物的类型输出到对应的子目录下。

其中：

- `root`: 表示所有构建产物输出的根目录。
- `html`：表示 HTML 文件的输出目录。
- `js`：表示 JavaScript 文件的输出目录。
- `css`：表示 CSS 样式文件的输出目录。
- `svg`：表示 SVG 图片的输出目录。
- `font`：表示字体文件的输出目录。
- `image`：表示非 SVG 图片的输出目录。
- `media`：表示视频等媒体资源的输出目录。
- `server`: 表示服务端产物的输出目录，仅在 target 为 `node` 时有效。

#### 示例

以 JavaScript 文件为例，会输出到 `distPath.root` + `distPath.js` 目录，即为 `dist/static/js`。

如果需要将 JavaScript 文件输出到 `build/resource/js` 目录，可以这样设置：

```js
export default {
  output: {
    distPath: {
      root: 'build',
      js: 'resource/js',
    },
  },
};
```
