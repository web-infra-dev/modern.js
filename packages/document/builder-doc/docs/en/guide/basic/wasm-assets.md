# Import Wasm Assets

Builder supports import WebAssembly assets in code.

:::tip What is WebAssembly
WebAssembly (Wasm) is a portable, high-performance binary format designed to execute CPU-intensive computing tasks in modern web browsers, bringing performance and reliability similar to native compiled code to the web platform.
:::

## Import

You can import a WebAssembly module directly in a JavaScript file:

```js title="index.js"
import { add } from './add.wasm';

console.log(add); // [native code]
console.log(add(1, 2)); // 3
```

WebAssembly modules can also be imported via Dynamic Import:

```js title="index.js"
import('./add.wasm').then(({ add }) => {
  console.log('---- Async Wasm Module');
  console.log(add); // [native code]
  console.log(add(1, 2)); // 3
});
```

You can also get the path of a WebAssembly module using the `new URL` syntax:

```js title="index.js"
const wasmURL = new URL('./add.wasm', import.meta.url);

console.log(wasmURL).pathname; // "/static/wasm/[hash].module.wasm"
```

## Output Directory

When a `.wasm` asset is imported, it will be output by Builder to the `dist/static/wasm` directory by default.

You can change the output directory of `.wasm` files via [output.distPath](/api/config-output.html#outputdistpath) config.

```ts
export default {
  output: {
    distPath: {
      wasm: 'resource/wasm',
    },
  },
};
```

## Add Type Declaration

When you import a Wasm file in TypeScript code, you usually need to add the corresponding type declaration.

For example, the `add.wasm` file exports an `add()` method, then you can create an `add.wasm.d.ts` file in the same directory and add the corresponding type declaration:

```ts title="add.wasm.d.ts"
export const add = (num1: number, num2: number) => number;
```
