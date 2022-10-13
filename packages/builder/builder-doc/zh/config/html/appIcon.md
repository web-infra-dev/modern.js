- Type: `string`
- Default: `undefined`

设置 app icon 的文件路径，可以为相对路径或绝对路径。

配置该选项后，在编译过程中会自动将图标拷贝至 dist 目录下，并在 HTML 中添加相应的 `link` 标签。

#### 示例

```js
export default {
  html: {
    appIcon: './src/assets/icon.png',
  },
};
```

重新编译后，HTML 中自动生成了以下标签：

```html
<link rel="app-touch-icon" sizes="180*180" href="/icon.png" />
```
