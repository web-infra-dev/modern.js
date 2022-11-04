- Type: `string`
- Default: `undefined`

设置页面的 favicon 图标。

配置该选项后，在编译过程中会自动将图标拷贝至 dist 目录下，并在 HTML 中添加相应的 `link` 标签。

#### 示例

```js
export default {
  html: {
    favicon: './src/assets/icon.png',
  },
};
```

重新编译后，HTML 中自动生成了以下标签：

```html
<link rel="icon" href="/favicon.ico" />
```
