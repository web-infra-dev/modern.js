- **Type**

```ts
type DataUriLimitConfig = {
  svg?: number;
  font?: number;
  image?: number;
  media?: number;
};
```

- **Default**

```js
const defaultDatUriLimit = {
  svg: 10000,
  font: 10000,
  image: 10000,
  media: 10000,
};
```

设置图片、字体、媒体等静态资源被自动内联为 base64 的体积阈值。

默认情况下，体积小于 10KB 的图片、字体、媒体等文件，会自动经过 Base64 编码，内联到页面中，不再会发送独立的 HTTP 请求。

你可以通过修改 `dataUriLimit` 参数来调整这个阈值。

其中：

- `svg`：表示 SVG 图片的体积阈值。
- `font`：表示字体文件的体积阈值。
- `image`：表示非 SVG 图片的体积阈值。
- `media`：表示视频等媒体资源的体积阈值。

#### 示例

修改图片资源的阈值为 5000 Bytes，设置视频资源不内联：

```js
export default {
  output: {
    dataUriLimit: {
      image: 5000,
      media: Infinite,
    },
  },
};
```
