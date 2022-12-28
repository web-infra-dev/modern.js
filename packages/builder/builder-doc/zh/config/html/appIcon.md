- Type: `string`
- Default: `undefined`

设置 app icon 的文件路径，可以设置为相对于项目根目录的相对路径，也可以设置为文件的绝对路径。暂不支持设置为 CDN URL。

配置该选项后，在编译过程中会自动将图标拷贝至 dist 目录下，并在 HTML 中添加相应的 `link` 标签。

#### 示例

设置为相对路径：

```js
export default {
  html: {
    appIcon: './src/assets/icon.png',
  },
};
```

设置为绝对路径：

```js
import path from 'path';

export default {
  html: {
    appIcon: path.resolve(__dirname, './src/assets/icon.png'),
  },
};
```

重新编译后，HTML 中自动生成了以下标签：

```html
<link rel="apple-touch-icon" sizes="180*180" href="/static/image/icon.png" />
```
