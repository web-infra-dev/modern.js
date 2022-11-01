---
title: source.globalVars

sidebar_label: globalVars
sidebar_position: 3
---

- 类型： `Object`
- 默认值： `undefined`

用来提供在代码中可用的环境变量，相当于 Webpack 的 [DefinePlugin](https://webpack.js.org/plugins/define-plugin/) 的语法糖。

:::tip 提示
框架内部会自动进行 JSON 序列化处理，因此不需要手动执行序列化。
:::

例如：

```js title="modern.config.js"
export default defineConfig({
  source: {
    globalVars: {
      VERSION: '1.0.2',
    },
  },
});
```

源代码中可以使用 `VERSION`，编译产物中 `VERSION` 会自动被替换为 `'1.0.2'`：

```js
console.log(VERSION); // => 1.0.2
```

## TS 类型定义

在 TypeScript 项目中，需要处理全局变量的类型，如:

```ts
declare let VERSION: string;
```
