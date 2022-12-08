# 浏览器范围

Builder 支持通过 [browserslist](https://browsersl.ist/) 来设置 Web 应用需要兼容的浏览器范围。

## 什么是 Browserslist

由于各种浏览器对 ECMAScript 和 CSS 的支持程度不同，因此开发者需要根据业务需求，为 Web 应用设置正确的浏览器范围。

[browserslist](https://browsersl.ist/) 可以指定 Web 应用能够在哪些浏览器中正常运行，它提供了统一的配置格式，并且已经成为了前端社区中的标准。Browserslist 被 Autoprefixer, Babel, ESLint, PostCSS，SWC 和 Webpack 等库所使用。

当你通过 `browserslist` 指定了一个浏览器范围时，Builder 会将 JavaScript 代码和 CSS 代码编译到指定的语法，并注入相应的 Polyfill 代码。

比如，当你需要适配 IE11 浏览器时，Builder 会将代码编译至 ES5，并通过 `core-js` 注入 IE11 所需的 Polyfill。

:::tip 什么是 Polyfill
Polyfill 是一种用于解决浏览器兼容问题的技术。它用于模拟某些浏览器不支持的新特性，使得这些特性能在不支持的浏览器中正常工作。例如，如果某个浏览器不支持 `Array.prototype.flat()` 方法，那么我们可以使用 Polyfill 来模拟这个方法，从而让代码在这个浏览器中也能正常工作。
:::

## Browserslist 默认值

Builder 会根据[构建产物类型](/guide/basic/build-target.html)来设置不同的 Browserslist 默认值。

### Web 产物

Web 产物的默认值如下所示：

```bash
> 0.01%
not dead
not op_mini all
```

在该浏览器范围下，JavaScript 代码被会编译到 ES5 语法。

### Node 产物

Node 产物默认最低兼容到 Node.js 14.0 版本。

```bash
node >= 14
```

### Web Worker 产物

Web Worker 产物默认的浏览器范围与 Web 一致。

```bash
> 0.01%
not dead
not op_mini all
```

### Modern Web 产物

Modern Web 产物默认最低兼容到支持[原生 ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) 的浏览器。

```bash
chrome > 61
edge > 16
firefox > 60
safari > 11
ios_saf > 11
```

## 设置 Browserslist

你可以在当前项目根目录的 `package.json` 或 `.browserslistrc` 文件里设置 browserslist 的值。

### 示例

通过 `package.json` 的 `browserslist` 设置：

```json
{
  "browserslist": [
    "iOS 9",
    "Android 4.4",
    "last 2 versions",
    "> 0.2%",
    "not dead"
  ]
}
```

通过独立的 `.browserslistrc` 文件设置：

```
iOS 9
Android 4.4
last 2 versions
> 0.2%
not dead
```

### 使用 output.overrideBrowserslist 配置

除了上述的标准用法，Builder 还提供了 [output.overrideBrowserslist](/zh/api/config-output.html#output-overridebrowserslist) 配置项，同样可以设置 browserslist 的值。

```ts
export default {
  output: {
    overrideBrowserslist: [
      'iOS 9',
      'Android 4.4',
      'last 2 versions',
      '> 0.2%',
      'not dead',
    ],
  },
};
```

当你同时构建多种类型的产物时，你可以为不同的产物类型设置不同的目标浏览器范围。此时，你需要把 `overrideBrowserslist` 设置为一个对象，对象的 key 为对应的产物类型。

比如为 `web` 和 `node` 设置不同的范围：

```js
export default {
  output: {
    overrideBrowserslist: {
      web: ['iOS 9', 'Android 4.4', 'last 2 versions', '> 0.2%', 'not dead'],
      node: ['node >= 14'],
    },
  },
};
```

大多数场景下，推荐优先使用 `.browserslistrc` 文件，而不是使用 `overrideBrowserslist` 配置。因为 `.browserslistrc` 文件是官方定义的配置文件，通用性更强，可以被社区中的其他库识别。
