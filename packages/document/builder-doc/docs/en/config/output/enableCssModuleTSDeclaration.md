- **Type:** `boolean`
- **Default:** `false`

Whether to generate a TypeScript declaration file for CSS modules.

:::tip
When using Rspack as the bundler, this configuration is only supported when set [disableCssExtract](https://modernjs.dev/builder/api/config-output.html#outputdisablecssextract) is true.
:::

### Example

Enable CSS module TypeScript declaration:

```js
export default {
  output: {
    enableCssModuleTSDeclaration: true,
  },
};
```

After building, there will be a `.d.ts` file for each CSS module file. For example

```ts
interface CssExports {
  title: string;
}
export const cssExports: CssExports;
export default cssExports;
```
