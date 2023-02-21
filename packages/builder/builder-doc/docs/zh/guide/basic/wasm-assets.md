# 引用 Wasm 资源

Builder 支持在代码引用 WebAssembly 资源。

:::tip
在使用 Rspack 作为打包工具时，暂时不支持引用 Wasm 资源。
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
