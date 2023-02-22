- **类型：** `string`
- **默认值：** `undefined`

设置页面的 favicon 图标，可以设置为：

- URL 地址。
- 文件的绝对路径。
- 相对于项目根目录的相对路径。

配置该选项后，在编译过程中会自动将图标拷贝至 dist 目录下，并在 HTML 中添加相应的 `link` 标签。

### 示例

设置为相对路径：

```js
export default {
  html: {
    favicon: './src/assets/icon.png',
  },
};
```

设置为绝对路径：

```js
import path from 'path';

export default {
  html: {
    favicon: path.resolve(__dirname, './src/assets/icon.png'),
  },
};
```

设置为 URL：

```js
import path from 'path';

export default {
  html: {
    favicon: 'https://foo.com/favicon.ico',
  },
};
```

重新编译后，HTML 中自动生成了以下标签：

```html
<link rel="icon" href="/favicon.ico" />
```
