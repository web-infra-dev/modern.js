---
sidebar_position: 5
---

# 客户端兼容性

## Polyfill 模式

### 编译时 Polyfill

Modern.js 在编译时默认通过 [core-js](https://github.com/zloirock/core-js) 引入对应的 Polyfill 代码。

默认情况下会根据项目 [Browserslist](https://github.com/browserslist/browserslist) 的设置情况引入所需的 Polyfill 代码， 这样基本不用再担心项目源码和第三方依赖的 Polyfill 问题了，但是因为包含了一些没有用到的 Polyfill 代码，所以最终的包大小可能会有所增加。

:::info 注
对于明确第三方依赖不需要 Polyfill 的场景，可以设置 [`output.polyfill`](/docs/apis/config/output/polyfill) 为 `usage`, 这样 Babel 编译时只会根据代码中使用到的语法引入 Polyfill 代码。
:::

### 运行时按需 Polyfill

Modern.js 中还提供了基于浏览器 [UA](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/User-Agent) 信息的运行时按需 Polyfill 方案，相比于 Babel 优势如下：

* 不会插入到代码中，只根据访问页面的设备，按需下发 Polyfill 代码 ，减少整体代码体积。
* 相同浏览器会公用一份 Polyfill 代码。因此，随着项目越来越多，基于 UA 的 Polyfill 代码下发速度会越来越快，综合速度超过常规方案。

可以通过微生成器开启该功能：

```bash
? 请选择你想要的操作：启用可选功能
? 启用可选功能：启用「基于 UA 的 Polyfill」功能
```

安装依赖后，配置 `output.polyfill` 为 `ua` 并且执行 `pnpm run build && pnpm run start` 启动服务器后，访问页面可以看到 HTML 产物中包含如下脚本:

```js
<script src="/__polyfill__" crossorigin></script>
```

在 Chrome 51 下访问页面可以看到 `http://localhost:8080/__polyfill__` 返回内容如下:


![ua-polyfill](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/ua-polyfill.png)


## 差异化分发

Modern.js 提供了运行时基于浏览器 User Agent 的差异化分发方案, 设置 [`output.enableModernMode`](/docs/apis/config/output/enable-modern-mode) 后， 生产环境会自动构建出针对现代浏览器语法未降级的 JS 产物和针对旧版本浏览器带有 Polyfill 的 JS 产物:

```bash title="dist/static/js"
├── 370.95db0e84-es6.js
├── 370.95db0e84-es6.js.map
├── 370.ace5d8a0.js
├── 370.ace5d8a0.js.map
├── main.64eb3bc7-es6.js
├── main.64eb3bc7-es6.js.map
├── main.c8aab430.js
├── main.c8aab430.js.map
├── runtime-main.9ad9a46b-es6.js
├── runtime-main.9ad9a46b-es6.js.map
├── runtime-main.dccca6e0.js
└── runtime-main.dccca6e0.js.map
```

同时 HTML 也会构建出对应的 ES6 版本:

```js title="dist/html/main/index-es6.html"
<script defer="defer" src="/static/js/370.95db0e84-es6.js"></script>
```

```js title="dist/html/main/index.html"
<script defer="defer" src="/static/js/370.ace5d8a0.js"></script>
```

通过 `pnpm run build && pnpm run start` 启动服务器, 访问页面时，会根据浏览器信息决定返回 `index-es6.html` 还是 `index.html`。

:::info 注
内部目前使用 [@babel/compat-data](https://github.com/babel/babel/blob/main/packages/babel-compat-data/data/native-modules.json) 来判断具体浏览器是否支持 es6 语法。
:::

## Browserslist 配置

Modern.js 支持在项目根目录 `package.json` 文件中的 `browserslist` 字段（或单独的 `.browserslistrc` 文件）指定项目覆盖的目标浏览器范围。该值会被 [`@babel/preset-env`](https://babeljs.io/docs/en/babel-preset-env) 和 [`autoprefixer`](https://github.com/postcss/autoprefixer) 用来确定需要转换的 JavaScript 语法特性和需要添加的 CSS 浏览器前缀。

Modern.js 中默认值如下:

```js
['> 0.01%', 'not dead', 'not op_mini all']
```

可以在[这里](https://github.com/browserslist/browserslist)了解如何自定义浏览器范围。
