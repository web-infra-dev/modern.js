---
sidebar_label: moduleScopes
sidebar_position: 9
---

# source.moduleScopes

:::info 适用的工程方案
MWA。
:::

- 类型： `Array<string | Regexp> | Function`
- 默认值： 无

限制源代码的引用路径，配置该选项后，只能从特定的目录下引用代码。

该选项**仅在配置后生效**，未配置时，Modern.js 不会限制源代码的引用路径。

## 效果演示

下面是使用 `moduleScopes` 后的效果演示。

以下代码为例, `src/App.tsx` 中导入 `src` 目录外部的模块:

```js title="src/App.tsx"
import a from '../utils/a';
```

在 `dev` 编译时，会提示引用路径错误:

![scopes-error](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/module-scopes-error.png)

通过该选项配置 `utils` 目录，再进行 `dev` 编译，则不会出现错误提示。

```js title="modern.config.js"
export default defineConfig({
  source: {
    moduleScopes: ['./utils'],
  },
});
```

## 类型

### Array 类型

此值为 `Array` 类型时，Modern.js 内部会生成一个默认值的数组，并与传入的配置值进行合并。

默认值的数组为：

- 未开启 BFF：`['./src', './shared', /node_modules/]`
- 开启 BFF：`['./src', './api', './shared', /node_modules/]`

比如添加以下配置：

```js title="modern.config.js"
export default defineConfig({
  source: {
    moduleScopes: ['./server'],
  },
});
```

则最终的 `moduleScopes` 值为 `['./src', './shared', './server', /node_modules/]`。

### Function 类型

值为 `Function` 类型时，内部默认值作为第一个参数传入，可以直接修改数组对象不做返回，也可以返回新的数组作为最终结果。

```js title="modern.config.js"
export default defineConfig({
  source: {
    moduleScopes: opts => {
      opts.push('./server');
    },
  },
});
```
