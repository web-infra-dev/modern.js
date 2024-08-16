- **类型：**

```ts
type AppIconItem = { src: string; size: number };

type AppIcon = string | {
  name?: string;
  icons: AppIconItem[];
};
```

- **默认值：** `undefined`

设置 iOS 系统下的 apple-touch-icon 图标的文件路径，可以设置为相对于项目根目录的相对路径，也可以设置为文件的绝对路径。暂不支持设置为 CDN URL。

配置该选项后，在编译过程中会自动将图标拷贝至 dist 目录下，并在 HTML 中添加相应的 `link` 标签。

### 示例

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
<link rel="apple-touch-icon" sizes="180x180" href="/static/image/icon.png" />
```

### 字符串形式

`string` 类型的 `appIcon` 配置是对象类型的一个语法糖。

```js
export default {
  html: {
    appIcon: './src/assets/icon.png',
  },
};
```

以上配置相当于下面配置的语法糖：

```js
export default {
  html: {
    appIcon: { icons: [{ src: './src/assets/icon.png', size: 180 }] }
  },
};
```

详细用法可参考 [Rsbuild - html.appIcon](https://rsbuild.dev/zh/config/html/app-icon)。
