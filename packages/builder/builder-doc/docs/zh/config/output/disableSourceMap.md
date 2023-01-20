- **类型：**

```ts
type DisableSourceMap =
  | boolean
  | {
      js?: boolean;
      css?: boolean;
    };
```

- **默认值：**

```ts
const defaultDisableSourceMap = {
  js: false,
  css: process.env.NODE_ENV === 'production',
};
```

是否禁用 Source Map 生成。

:::tip 什么是 Source Map
Source Map 是保存源代码映射关系的信息文件，它记录了编译后的代码的每一个位置，以及所对应的编译前的位置。通过 Source Map，可以在调试编译后的代码时，直接查看对应的源代码。
:::

默认情况下，Builder 的 Source Map 生成规则如下：

- 在开发环境构建时，会生成 JS 文件和 CSS 文件的 SourceMap，便于进行开发调试。
- 在生产环境构建时，会生成 JS 文件的 Source Map，用于调试和排查线上问题；不会生成 CSS 文件的 Source Map。

如果项目不需要 Source Map，可以关闭该功能，从而提升构建的速度。

```js
export default {
  output: {
    disableSourceMap: true,
  },
};
```

如果需要开启开发环境的 Source Map，并在生产环境禁用，可以设置为：

```js
export default {
  output: {
    disableSourceMap: process.env.NODE_ENV === 'production',
  },
};
```

如果需要单独控制 JS 文件或 CSS 文件的 Source Map，可以参考下方设置：

```js
export default {
  output: {
    disableSourceMap: {
      js: false,
      css: true,
    },
  },
};
```
