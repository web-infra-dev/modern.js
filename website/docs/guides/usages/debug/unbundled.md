---
title: Unbundled 开发模式
sidebar_position: 999
---

:::warning
Unbundled 开发模式已停止维护，后续不再迭代新功能，请使用 `pnpm run dev` 进行开发。
:::

## 介绍

Modern.js 提供 **Unbundled 开发模式**。当项目以 **Unbundled 开发模式**启动时，项目依赖的模块不会被进行打包处理，而是直接使用原生的 ESM 模块，由现代浏览器负责模块的解析和加载，从而实现模块的按需加载。**Unbundled 开发模式**可以让 Dev Server 拥有秒级的启动速度和热更新速度，极大地提高了开发效率和体验。

:::info 注
ES modules（ESM）是 JavaScript 官方的标准化模块系统。
:::

:::caution 注意
1. 由于浏览器兼容性等问题，**Unbundled 开发模式**仅适用于开发阶段。在生产环境部署的项目，仍然需要先经过编译打包处理。
2. **Unbundled 开发模式** 暂不支持 SSR。
3. **Unbundled 开发模式** 暂不支持在 Windows 平台使用
:::

## 开始使用

在 Modern.js 中使用 **Unbundled 开发模式**，需要在项目根路径下执行 `pnpm run new`，然后进行如下选择：

```bash
? 请选择你想要的操作： 启用可选功能
? 启用可选功能： 启用「Unbundled 开发」模式
```

现在，执行 `pnpm run dev:esm` 命令，项目就会以 **Unbundled 开发模式**启动。浏览器访问 `http://localhost:8080`，打开开发者工具的 Network 窗口，发现加载的 JS 资源都是未经过打包的 ESM 模块规范的文件。

## 实现原理和注意事项

为了更好的理解 **Unbundled 开发模式**，本章节从下面几个方面分别介绍：

### 依赖预处理

当前，很多第三方依赖只提供了 CommonJS 产物，无法直接在浏览器中运行，另外，即使第三方依赖提供 ESM 产物，如果按照习惯使用，例如:

```js
import { something } from 'some-package';
```

在浏览器中直接运行也会报错。 Modern.js 为了解决上述问题，会对第三方依赖进行如下处理。

:::info 对第三方依赖进行如下处理方式
1. 首次启动 Dev Server 时，分析项目源代码，找出使用到的第三方依赖，例如 [react](https://www.npmjs.com/package/react)、[react-dom](https://www.npmjs.com/package/react-dom) 等。


2. 根据依赖在 `node_modules/` 目录下的实际安装位置，获取精确的版本号信息。


3. 根据包名和版本号，依次检查是否命中本地缓存和 Modern.js 的云端缓存，均未命中的情况下，本地编译该模块，转换为 ESM 格式。后续针对获取到的 ESM 文件，使用 [esbuild](https://esbuild.github.io/) 打包成一个文件，以减少项目运行时浏览器中的请求数量。


4. Dev Server 启动时，动态改写源码文件中对第三方依赖的引用路径，例如：

  ```js
  import { useState } from 'react'
  ```

  会被改写为：

  ```js
  import { useState } from 'node_modules/.modern_js_web_modules/react.js'
  ```

  从而保证浏览器能够正确加载第三方依赖。

:::

相同依赖的项目，使用 Modern.js 的 **Unbundled 开发模式**和使用 [Snowpack](https://www.snowpack.dev/) 进行开发，Dev Server 的启动时间对比如下:

|                  | 首次预处理 node_modules                  | 添加依赖后，再次运行       | 依赖无变化时，再次运行 |
| ---------------- | ---------------------------------------- | ----------------------- | -------------------- |
| Snowpack         | 24.27s                                   | 25.88s                  | < 1s                 |
| Modern.js Unbundled | 命中云端缓存: 9.31s；本地直接编译: 30.81s | 2.6s                    | < 1s                 |

可以发现，在常见的开发场景中，使用 **Unbundled 开发模式** ，能够节省更多依赖预处理时间。


### JSX/TSX

`.jsx` 和 `.tsx` 文件不能直接在浏览器中运行。当请求这类格式的文件资源时，Modern.js 会使用 [esbuild](https://esbuild.github.io/) 将原始文件编译成 `.js` 文件。

:::warning 注意
Modern.js 利用 Babel 插件支持的一些语法，esbuild 并不支持，使用 **Unbundled 开发模式** 时，请避开这些语法的使用：
 [Pipeline Operator](https://github.com/tc39/proposal-pipeline-operator)。
另外，使用 TypeScript 开发时，还需要注意：

1. esbuild 的 [`transform`](https://esbuild.github.io/api/#transform-api) 不支持从 `.d.ts` 中跨文件导入 [const enum](https://www.typescriptlang.org/docs/handbook/enums.html#const-enums) 使用。
2. Dev Server 不会对 TS 文件执行类型检查，因此依赖 IDE 进行类型校验。
:::

### CSS

浏览器中通过 `import` 语法导入的资源，要求资源类型是 `application/javascript`。当 JS 文件中导入 CSS 文件时，Modern.js 会将 CSS 内容**包装**到 JS 文件中，最终创建 `style` 标签，插入到 `head` 标签内。

### 图片资源处理

#### JS 中使用图片

JS 文件中引入的图片资源会返回解析之后的 URL：

```js title=src/App.jsx
import logoUrl from './logo.png';

console.log(logoUrl); // 输出： '/src/logo.png';
```

#### Base64 编码内联

默认情况下，小于 10kb 的图片、字体文件，会经过 Base64 编码，内联进页面，不会再发送独立的请求。

可以通过配置 [`output.dataUriLimit`](/docs/apis/config/output/data-uri-limit) 修改这个阈值。

#### JS 中使用 SVG

针对 SVG 资源，默认启用了 [SVGR](https://react-svgr.com/)，可以通过 React 组件的形式导入：

```js title=App.jsx
import logoUrl, { ReactComponent as LogoComponent } from './logo.svg';
```

#### CSS 中使用图片

在 CSS 文件中既可以通过相对路径也可以通过别名的方式引入图片:

```css
.logo {
  background: url('./foo.png');
}

/** or **/
.logo {
  background: url('@/foo.png');
}
```

### JSON

支持直接使用默认导入的方式导入 JSON 文件:

```json title=data.json
{
  "name": "a"
}
```

``` javascript title=App.jsx
import jsonData from './data.json';

console.log(jsonData); // => { name: 'a'}
```

### 热更新（ HMR ）

一般情况下，不需要进行任何修改，**Unbundled 开发模式**下就可以正常使用热更新功能。此外，**Unbundled 开发模式**在 [ESM-HMR Spec](https://github.com/snowpackjs/esm-hmr) 的基础上，增加了 Webpack 场景常用的 `module.hot` 用法支持。同时也可以直接在代码中使用 `import.meta.hot.accept` 方式注册依赖更新时的回调，例如:

```js title=b.js
export const name = 'b';
```

```js title=a.js
import { name } from './b';

export const age = 1;

import.meta.hot.accept('./b', modules => {
  console.log(modules);  // 输出最新的 a、b 模块
});
```

当修改 `b.js` 后，在浏览器的控制台可以看到对应的日志输出。

### HTTP 2.0

 **Unbundled 模式**下，每个依赖都会对应一个网络请求，因此会存在大量的网络请求。通过开启 [HTTP 2.0](https://zh.wikipedia.org/wiki/HTTP/2)，可以进一步优化资源加载速度。配置 [`dev.https`](/docs/apis/config/dev/https) 为 `true`，即可同时启用 [TLS](https://en.wikipedia.org/wiki/Transport_Layer_Security) 和 [HTTP 2.0](https://zh.wikipedia.org/wiki/HTTP/2) 的支持。

### 其他注意事项

[`output.inject`](/docs/apis/config/output/inject)、[`output.copy`](/docs/apis/config/output/copy)、[`output.polyfill`](/docs/apis/config/output/polyfill) 配置在 **Unbundled 模式**下不支持。
