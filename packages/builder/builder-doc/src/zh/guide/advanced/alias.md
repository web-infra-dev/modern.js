# 路径别名

路径别名（alias）允许开发者为模块定义别名，以便于在代码中更方便的引用它们。

例如，假如你在项目中经常引用 `src/common/request.ts` 模块，你可以为它定义一个别名 `@request`，然后在代码中通过 `import request from '@request'` 来引用它，而不需要每次都写出完整的相对路径。同时，这也允许你将模块移动到不同的位置，而不需要更新代码中的所有 import 语法。

在 Builder 中，你有两种方式可以设置路径别名:

- 通过 [source.alias](/api/config-source.html#source-alias) 配置。
- 通过 `tsconfig.json` 中的 `paths` 配置。

## 通过 `source.alias` 配置

[source.alias](/api/config-source.html#source-alias) 对应 webpack 原生的 [resolve.alias](https://webpack.js.org/configuration/resolve/#resolvealias) 配置，你可以通过对象或者函数的方式进行配置。

首先你可以通过对象的方式进行配置，比如：

```js
export default {
  source: {
    alias: {
      '@common': './src/common',
    },
  },
};
```

其中的相对路径会被 Builder 自动补全为绝对路径。

你也可以配置为一个函数，拿到预设的 `alias` 对象，对其进行修改，比如：

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

## 通过 `tsconfig.json` 中的 `paths` 配置

除了 `source.alias`，你还可以通过 `tsconfig.json` 中的 `paths` 进行配置，这是我们在 TypeScript 项目中推荐使用的方式，因为可以解决路径别名的类型问题。

比如：

```json
{
  "compilerOptions": {
    "paths": {
      "@common/*": ["./src/common/*"]
    }
  }
}
```

:::tip 优先级
`paths` 配置的优先级高于 `source.alias`。
:::
