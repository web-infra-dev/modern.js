- Type: `boolean`
- Default: `false`

是否生成 CSS Modules 的 TypeScript 声明文件。

#### Example

启用 CSS Module TypeScript 声明，比如：

```js
export default {
  output: {
    enableCssModuleTSDeclaration: true,
  },
};
```

项目构建完成后，每个 CSS Module 文件都会生成一个 `.d.ts` 文件。例如：

```ts
interface CssExports {
  'title': string;
}
export const cssExports: CssExports;
export default cssExports;
```
