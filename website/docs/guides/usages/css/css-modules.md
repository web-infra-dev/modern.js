---
sidebar_position: 5
---

# CSS Modules

Modern.js 为 [CSS Modules](https://github.com/css-modules/css-modules) 提供了开箱即用的支持。

## 文件后缀形式 CSS Modules

默认情况下，以 `.module.(css|scss|sass|less)` 结尾的文件会作为 CSS Modules 文件处理，例如：

```css title="button.module.css"
.redColor {
  color: red;
}
```

```js title="Button.jsx"
import styles from './button.module.css';

export default function Button() {
  return (
    <button type="button" className={styles.redColor}>
      red button
    </button>
  );
}
```

最终将被编译为

```js
<button type="button" className="button_redColor__1-RBg">
  red button
</button>;
```

## 全面启用 CSS Modules

如果想去掉文件名中 `.module` 后缀，可以设置 [`output.disableCssModuleExtension`](/docs/apis/config/output/disable-css-module-extension)。

设置后，除了 `node_modules/` 目录下的样式文件和文件名称格式为 `[name].global.(css|scss|sass|less)` 之外的所有样式文件，都会作为 CSS Modules 处理。

如果此时需要全局样式，可以通过创建文件名称格式为 `[name].global.(css|less|scss|sass)` 的样式文件来解决， 例如:

```css title="app.global.css"
.bg-blue {
  background-color: blue;
}
```

```css title="button.css"
.redColor {
  color: red;
}
```

```js title="App.jsx"
import './app.global.css';
import styles from './button.css';

export default function Button() {
  return (
    <button type="button" className={`${styles.redColor} bg-blue`}>
      button
    </button>
  );
}
```

最终将被编译为:

```js
<button type="button" className="button__redColor--JsFYl bg-blue">
  button
</button>;
```

最终效果如下：

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/more-css-modules.png)

:::tip 提示
使用 [babel-plugin-react-css-modules](https://github.com/gajus/babel-plugin-react-css-modules) 时需要注意，该插件的配置选项 `generateScopedName` 需要和 [`output.cssModuleLocalIdentName`](/docs/apis/config/output/css-module-localIdent-name) 保持一致。
:::
