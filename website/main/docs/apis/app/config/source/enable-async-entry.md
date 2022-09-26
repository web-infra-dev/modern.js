---
title: source.enableAsyncEntry
sidebar_label: enableAsyncEntry
sidebar_position: 7
---

- 类型： `boolean`
- 默认值： `false`

该选项用于 webpack 模块联邦 (Module Federation）场景。

开启此选项后，Modern.js 会通过 Dynamic Import 来包裹自动生成的入口文件（asynchronous boundary），使页面代码可以消费模块联邦生成的远程模块。

## 背景知识

如果不了解 webpack 模块联邦，请先阅读 Module Federation 官方文档：

- [中文文档](https://webpack.docschina.org/concepts/module-federation/)
- [英文文档](https://webpack.js.org/concepts/module-federation)

## 示例

首先，在配置文件中开启此选项：

```js title="modern.config.js"
export default defineConfig({
  source: {
    enableAsyncEntry: true,
  },
});
```

然后执行 `dev` 或 `build` 命令，可以看到 Modern.js 自动生成的文件变为以下结构：

```bash
node_modules
  └─ .modern-js
     └─ main
        ├─ bootstrap.js  # 真正的入口代码
        ├─ index.js      # 异步入口文件（asynchronous boundary）
        └─ index.html
```

其中 `index.js` 的内容如下：

```js
import('./bootstrap.js');
```

此时，就可以在当前页面中消费任意的远程模块了。

:::info
Modern.js 未对 webpack 的 ModuleFederationPlugin 进行封装，请通过 [tools.webpackChain](/docs/apis/app/config/tools/webpack-chain) 自行配置 ModuleFederationPlugin。
:::
