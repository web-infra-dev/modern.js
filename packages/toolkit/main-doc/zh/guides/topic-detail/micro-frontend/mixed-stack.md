---
sidebar_position: 5
title: 混合技术栈
---

Modern.js 微前端方案是基于 [Garfish](https://garfish.top/) 封装的，提供了一些更开箱即用的使用方式。

当你的主应用和子应用不全是 Modern.js 应用的时候，可以参考这片文档。

1. 子应用是 **Modern.js**，主应用使用的原生 Garfish 微前端。
2. 主应用是 **Modern.js**，子应用有的是其它技术栈。

## 子应用是 Modern.js

**Modern.js** 子应用编译后会生成标准的 [Garfish 子应用导出](https://garfish.top/quick-start#%E5%AD%90%E5%BA%94%E7%94%A8)。
所以可以直接接入标准的微前端主应用。

:::info 注
子应用是 **Modern.js**，主应用使用的原生 Garfish 微前端时，**子应用调试模式** 不可用。
:::

## 主应用是 Modern.js

主应用是 **Modern.js**，子应用用的其它技术栈。子应用按照 [Garfish 子应用标准](https://garfish.top/quick-start#%E5%AD%90%E5%BA%94%E7%94%A8) 开发即可。
