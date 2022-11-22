# 引用静态资源

Builder 支持在代码中引用图片、字体、媒体类型的静态资源。

## 静态资源格式

以下是 Builder 默认支持的静态资源格式：

- **图片**：png、jpg、jpeg、gif、svg、bmp、webp、ico、apng、avif、tiff。
- **字体**：woff、woff2、eot、ttf、otf、ttc。
- **媒体**：mp4、webm、ogg、mp3、wav、flac、aac、mov。

如果你需要引用其他格式的静态资源，请通过 [GitHub Issues](https://github.com/modern-js-dev/modern.js/issues) 进行反馈。

:::tip SVG 图片
SVG 图片是一种特殊情况，Builder 提供了 SVG 转 React 组件的能力，对 SVG 进行单独处理，详见 [引用 SVG 资源](/guide/basic/svg-assets.html)。
:::

## 在 JS 文件中引用

在 JS 文件中，可以直接通过 `import` 的方式引用相对路径下的静态资源：

```tsx
// 引用 static 目录下的 logo.png 图片
import logo from './static/logo.png';

export default = () => <img src={logo} />;
```

也支持使用[路径别名](/guide/basic/alias.html)来引用：

```tsx
import logo from '@/static/logo.png';

export default = () => <img src={logo} />;
```

## 在 CSS 文件中引用

在 CSS 文件中，可以引用相对路径下的静态资源：

```css
.logo {
  background-image: url('../static/logo.png');
}
```

也支持使用[路径别名](/guide/basic/alias.html)来引用：

```css
.logo {
  background-image: url('@/static/logo.png');
}
```

## 引用结果

引用静态资源的结果取决于文件体积：

- 当文件体积大于 10KB 时，会返回一个 URL，同时文件会被输出到构建产物目录下。
- 当文件体积小于 10KB 时，会自动被内联为 Base64 格式。

```js
import largeImage from './static/largeImage.png';
import smallImage from './static/smallImage.png';

console.log(largeImage); // "/static/largeImage.6c12aba3.png"
console.log(smallImage); // "data:image/png;base64,iVBORw0KGgo..."
```

关于资源内联的更详细介绍，请参考 [静态资源内联](/guide/advanced/inline-assets.html) 章节。

## 构建产物

当静态资源被引用后，会自动被输出到构建产物的目录下，你可以：

- 通过 [output.filename](/zh/api/config-output.html#output-filename) 来修改产物的文件名。
- 通过 [output.distPath](/zh/api/config-output.html#output-distpath) 来修改产物的输出路径。

## URL 前缀

引用静态资源后返回的 URL 中会自动包含路径前缀：

- 在开发环境下，通过 [dev.assetPrefix](/zh/api/config-dev.html#dev-assetprefix) 设置路径前缀。
- 在生产环境下，通过 [output.assetPrefix](/zh/api/config-output.html#output-assetprefix) 设置路径前缀。

比如将 `output.assetPrefix` 设置为 `https://modern.com`：

```js
import logo from './static/logo.png';

console.log(logo); // "https://modern.com/static/logo.6c12aba3.png"
```

## 图片格式

在使用图片资源时，你可以根据下方表格中图片的优缺点以及适用场景，来选择合适的图片格式。

| 格式 | 优点                                                             | 缺点                                   | 适用场景                                                                     |
| ---- | ---------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------- |
| PNG  | 无损压缩，不会丢失图片细节，不失真，支持半透明                   | 不适合色表复杂的图片                   | 适合颜色数量少，边界层次分明的图片，适合用在 logo、icon、透明图等场景        |
| JPG  | 颜色丰富                                                         | 有损压缩，会导致图片失真，不支持透明度 | 适合颜色数量多，颜色带有渐变、过度复杂的图片，适合用在人像照片、风景图等场景 |
| WebP | 同时支持有损压缩与无损压缩，支持透明度，体积比 PNG 和 JPG 小很多 | iOS 兼容性不好                         | 几乎任何场景的像素图片，支持 WebP 的宿主环境，都应该首选 WebP 图片格式       |
| SVG  | 无损格式，不失真,支持透明度                                      | 不适合复杂图形                         | 适合矢量图,适合用于 icon                                                     |
