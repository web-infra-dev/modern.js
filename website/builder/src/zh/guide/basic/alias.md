# 路径别名

在 Builder 中，你有两种方式可以设置路径别名:

- 通过 `source.alias` 配置
- 通过 `tsconfig.json` 中的 `paths` 配置

## 通过 `source.alias`

`source.alias` 对应 webpack 原生的 `resolve.alias`，你可以通过对象或者函数的方式进行配置。

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

其中的相对路径会被 Builder 解析为绝对路径。

你也可以配置为一个函数，拿到预设的 `alias` 对象，对其进行修改，比如：

```js
export default {
  source: {
    alias: (alias) => {
      alias['@common'] = './src/common';
      return alias;
    },
  },
};
```

## 通过 `tsconfig.json` 中的 `paths` 配置

除了 `source.alias`，你还可以通过 `tsconfig.json` 中的 `paths` 进行配置，比如：

```json
{
  "compilerOptions": {
    "paths": {
      "@common/*": ["./src/common/*"]
    }
  }
}
```

> `paths` 配置的优先级高于 `source.alias`。
