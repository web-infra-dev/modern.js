# 设置浏览器范围

Builder 支持通过 [Browserslist](https://browsersl.ist/) 来设置 Web 应用需要兼容的浏览器范围。

## 什么是 Browserslist

由于各种浏览器对 ECMAScript 和 CSS 的支持程度不同，因此开发者需要根据业务需求，为 Web 应用设置正确的浏览器范围。

[Browserslist](https://browsersl.ist/) 可以指定 Web 应用能够在哪些浏览器中正常运行，它提供了统一的配置格式，并且已经成为了前端社区中的标准。Browserslist 被 Autoprefixer, Babel, ESLint, PostCSS，SWC 和 Webpack 等库所使用。

当你通过 Browserslist 指定了一个浏览器范围时，Builder 会将 JavaScript 代码和 CSS 代码编译到指定的语法，并注入相应的 polyfill 代码。**当你只需要兼容更现代的浏览器时，编译过程会引入更少的兼容代码和 polyfills，页面的性能会更好。**

比如，当你需要适配 IE11 浏览器时，Builder 会将代码编译至 ES5，并通过 `core-js` 注入 IE11 所需的 polyfill。

:::tip 什么是 polyfill
polyfill 是一种用于解决浏览器兼容问题的技术。它用于模拟某些浏览器不支持的新特性，使得这些特性能在不支持的浏览器中正常工作。例如，如果某个浏览器不支持 `Array.prototype.flat()` 方法，那么我们可以使用 polyfill 来模拟这个方法，从而让代码在这个浏览器中也能正常工作。
:::

## 设置 Browserslist

你可以在当前项目根目录的 `package.json` 或 `.browserslistrc` 文件里设置 Browserslist 的值。

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

除了上述的标准用法，Builder 还提供了 [output.overrideBrowserslist](/api/config-output.html#output-overridebrowserslist) 配置项，同样可以设置 Browserslist 的值。

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

## 常用的浏览器范围

以下是一些常用的浏览器范围，你可以根据自己的项目类型进行选择。

### 移动端 H5 场景

移动端 H5 场景主要兼容 `iOS` 和 `Android` 系统，通常我们将 Browserslist 设置为：

```
iOS 9
Android 4.4
last 2 versions
0.2%
not dead
```

以上浏览器范围会将代码编译至 ES5 规范，可以兼容市面上绝大多数移动端场景，具体对应的浏览器列表可以查看 [browserslist.dev](https://browserslist.dev/?q=aU9TIDksIEFuZHJvaWQgNC40LCBsYXN0IDIgdmVyc2lvbnMsID4gMC4yJSwgbm90IGRlYWQ%3D)。

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/browserslist-dev-1222.png)

你也可以选择在 H5 场景使用 ES6 规范，这样会让页面的性能表现更好，对应的 Browserslist 如下：

```
iOS 10
Chrome 51
> 0.2%
not dead
not op_mini all
```

### 桌面端 PC 场景

在桌面端 PC 场景下，如果你需要兼容 IE 11 浏览器，则可以将 Browserslist 设置为：

```
> 0.5%
not dead
IE 11
```

以上浏览器范围会将代码编译至 ES5 规范，具体对应的浏览器列表可以查看 [browserslist.dev](https://browserslist.dev/?q=PiAwLjUlLCBub3QgZGVhZCwgSUUgMTE%3D)。

如果你不需要兼容 IE 11 浏览器，那么可以调整 Browserslist 来获得更高性能的产物，比如设置为支持原生 ES Modules 的浏览器：

```
chrome > 61
edge > 16
firefox > 60
safari > 11
ios_saf > 11
```

## Browserslist 默认值

Builder 会根据[构建产物类型](/guide/basic/build-target.html)来设置不同的 Browserslist 默认值，但我们推荐你在项目中显式设置 Browserslist，这会让项目的兼容范围更加明确。

### Web 产物

Web 产物的默认值如下所示：

```
> 0.01%
not dead
not op_mini all
```

在该浏览器范围下，JavaScript 代码被会编译到 ES5 语法。

### Node 产物

Node 产物默认最低兼容到 Node.js 14.0 版本。

```
node >= 14
```

### Web Worker 产物

Web Worker 产物默认的浏览器范围与 Web 一致。

```
> 0.01%
not dead
not op_mini all
```

### Modern Web 产物

Modern Web 产物默认最低兼容到支持[原生 ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) 的浏览器。

```
chrome > 61
edge > 16
firefox > 60
safari > 11
ios_saf > 11
```

## 查询浏览器支持情况

在开发时，我们需要了解某些特性或 API 的浏览器支持情况，此时我们可以在 [caniuse](https://caniuse.com/) 网站上进行查询。

比如我们需要知道 `Promise` 的浏览器支持情况，只需要在 [caniuse](https://caniuse.com/) 中输入 `Promise`，就可以看到以下结果：

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/caniuse-demo-1222.png)

从上表可以看出，`Promise` 在 Chrome 33 和 iOS 8 中得到了原生支持，但是在 IE 11 中不被支持。
