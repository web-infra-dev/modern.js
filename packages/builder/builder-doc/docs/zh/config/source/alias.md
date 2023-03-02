- **类型：** `Record<string, string | string[]> | Function`
- **默认值：** `undefined`

设置文件引用的别名，对应 webpack 的 [resolve.alias](https://webpack.js.org/configuration/resolve/#resolvealias) 配置。

:::tip
对于 TypeScript 项目，只需要在 `tsconfig.json` 中配置 [compilerOptions.paths](https://www.typescriptlang.org/tsconfig#paths) 即可，Builder 会自动识别 `tsconfig.json` 里的别名，因此不需要额外配置 `alias` 字段。
:::

:::tip
在使用 Rspack 作为打包工具时，只支持 `Record<string, string> | Function` 类型。
:::

#### Object 类型

`alias` 的值可以定义为 Object 类型，其中的相对路径会自动被 Builder 转换为绝对路径。

```js
export default {
  source: {
    alias: {
      '@common': './src/common',
    },
  },
};
```

以上配置完成后，如果在代码中引用 `@common/Foo.tsx`, 则会映射到 `<root>/src/common/Foo.tsx` 路径上。

#### Function 类型

`alias` 的值定义为函数时，可以接受预设的 alias 对象，并对其进行修改。

```js
export default {
  source: {
    alias: alias => {
      alias['@common'] = './src/common';
    },
  },
};
```

也可以在函数中返回一个新对象作为最终结果，新对象会覆盖预设的 alias 对象。

```js
export default {
  source: {
    alias: alias => {
      return {
        '@common': './src/common',
      };
    },
  },
};
```
