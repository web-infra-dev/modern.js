---
sidebar_position: 5
---

# CSS Modules

Modern.js out of the box support for [CSS Modules](https://github.com/css-modules/css-modules).

## File Suffix Form CSS Modules

By default, files ending in `.module.(css|scss|sass|less)` are treated as CSS Modules files, for example:

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

Will eventually be compiled as:

```js
<button type="button" className="button_redColor__1-RBg">
  red button
</button>
```

## Global CSS Modules

If you want to remove the `.module` suffix from the filename, you can set [`output.disable CssModuleExtension`](/docs/configure/app/output/disable-css-module-extension).

After setting, all style files except the style files in the `node_modules/` directory and the file name format of `[name].global.(css|scss|sass|less)` will be processed as CSS Modules.

If you need global styles at this point, you can solve it by creating a style file with the filename format `[name].global.(css|scss|sass|less)`, for example:

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

Will eventually be compiled as:

```js
<button type="button" className="button__redColor--JsFYl bg-blue">
  button
</button>
```

The final effect is as follows:

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/more-css-modules.png)

:::tip
When using [babel-plugin-react-css-modules](https://github.com/gajus/babel-plugin-react-css-modules), it is important to note that the configuration option `generateScopedName` of this plugin needs to be the same as [`output.css ModuleLocalIdentName`](/docs/configure/app/output/css-module-local-ident-name).
:::
