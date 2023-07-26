# 路径别名

路径别名（alias）允许开发者为模块定义别名，以便于在代码中更方便的引用它们。当你想要使用一个简短、易于记忆的名称来代替冗长复杂的路径时，这将非常有用。

例如，假如你在项目中经常引用 `src/common/request.ts` 模块，你可以为它定义一个别名 `@request`，然后在代码中通过 `import request from '@request'` 来引用它，而不需要每次都写出完整的相对路径。同时，这也允许你将模块移动到不同的位置，而不需要更新代码中的所有 import 语法。

在 Builder 中，你有两种方式可以设置路径别名:

- 通过 `tsconfig.json` 中的 `paths` 配置。
- 通过 [source.alias](/api/config-source.html#sourcealias) 配置。

## 通过 `tsconfig.json` 的 `paths` 配置

你可以通过 `tsconfig.json` 中的 `paths` 来配置别名，这是我们在 TypeScript 项目中推荐使用的方式，因为它可以解决路径别名的 TS 类型问题。

比如：

```json title="tsconfig.json"
{
  "compilerOptions": {
    "paths": {
      "@common/*": ["./src/common/*"]
    }
  }
}
```

以上配置完成后，如果你在代码中引用 `@common/Foo.tsx`, 则会映射到 `<project>/src/common/Foo.tsx` 路径上。

:::tip
你可以阅读 [TypeScript - paths](https://www.typescriptlang.org/tsconfig#paths) 文档来了解更多用法。
:::

## 通过 `source.alias` 配置

Builder 提供了 [source.alias](/api/config-source.html#sourcealias) 配置项，对应 webpack / Rspack 原生的 [resolve.alias](https://webpack.js.org/configuration/resolve/#resolvealias) 配置，你可以通过对象或者函数的方式来配置这个选项。

### 使用场景

由于 `tsconfig.json` 的 `paths` 配置是写在静态 JSON 文件里的，因此它不具备动态性。

而 `source.alias` 则可以弥补这一不足，你可以通过 JavaScript 代码来动态设置 `source.alias`（比如基于环境变量来设置）。

### 对象用法

你可以通过对象的方式来配置 `source.alias`，其中的相对路径会被 Builder 自动补全为绝对路径。

比如：

```js
export default {
  source: {
    alias: {
      '@common': './src/common',
    },
  },
};
```

以上配置完成后，如果你在代码中引用 `@common/Foo.tsx`, 则会映射到 `<project>/src/common/Foo.tsx` 路径上。

### 函数用法

你也可以将 `source.alias` 配置为一个函数，拿到内置的 `alias` 对象，对其进行修改。

比如：

```js
export default {
  source: {
    alias: alias => {
      alias['@common'] = './src/common';
      return alias;
    },
  },
};
```

### 优先级

`tsconfig.json` 的 `paths` 配置的优先级高于 `source.alias`，当一个路径同时匹配到这两者定义的规则时，会优先使用 `tsconfig.json` 的 `paths` 定义的值。

你可以通过 [source.aliasStrategy](/api/config-source.html#sourcealiasstrategy) 来调整这两个选项的优先级。
