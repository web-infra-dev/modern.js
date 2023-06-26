# 引用 Wasm 资源

Builder 支持在代码引用 WebAssembly 资源。

:::tip 什么是 WebAssembly
WebAssembly（缩写为 wasm）是一种可移植、高性能的字节码格式，被设计用来在现代 Web 浏览器中执行 CPU 密集型计算任务，为 Web 平台带来了接近本地编译代码的性能和可靠性。
:::

## 引用方式

你可以直接在 JavaScript 文件中引用一个 WebAssembly 模块：

```js title="index.js"
import { add } from './add.wasm';

console.log(add); // [native code]
console.log(add(1, 2)); // 3
```

也可以通过 Dynamic Import 来引用 WebAssembly 模块：

```js title="index.js"
import('./add.wasm').then(({ add }) => {
  console.log('---- Async Wasm Module');
  console.log(add); // [native code]
  console.log(add(1, 2)); // 3
});
```

还可以通过 `new URL` 语法来获取 WebAssembly 模块的路径：

```js title="index.js"
const wasmURL = new URL('./add.wasm', import.meta.url);

console.log(wasmURL).pathname; // "/static/wasm/[hash].module.wasm"
```

## 输出目录

当 `.wasm` 资源被引用后，默认会被 Builder 输出到 `dist/static/wasm` 目录下。

你可以通过 [output.distPath](/api/config-output.html#outputdistpath) 配置项来修改 `.wasm` 产物的输出目录。

```ts
export default {
  output: {
    distPath: {
      wasm: 'resource/wasm',
    },
  },
};
```

## 添加类型声明

当你在 TypeScript 代码中引用 Wasm 文件时，通常需要添加相应的类型声明。

比如 `add.wasm` 文件导出了 `add()` 方法，那么你可以在同级目录下创建一个 `add.wasm.d.ts` 文件，并添加相应的类型声明：

```ts title="add.wasm.d.ts"
export const add = (num1: number, num2: number) => number;
```
