# 功能类问题

## 如何配置组件库按需引入？

如果需要配置组件库的按需引入，可以通过 [tools.babel](/api/config-tools.html#tools-babel) 配置 [babel-plugin-import](https://github.com/umijs/babel-plugin-import) 插件。

```ts
export default {
  tools: {
    babel: (config, { addPlugins }) => {
      addPlugins([
        [
          'babel-plugin-import',
          {
            libraryName: 'xxx-components',
            libraryDirectory: 'es',
            style: true,
          },
        ],
      ]);
    },
  },
};
```

## 如何在编译过程中进行 ESLint 代码校验？

出于编译性能的考虑，Builder 默认不会在编译过程中进行 ESLint 校验，如果需要该功能，可以手动安装并注册社区中的 [eslint-webpack-plugin](https://github.com/webpack-contrib/eslint-webpack-plugin)。

注册该插件的示例代码如下：

```js
import ESLintPlugin from 'eslint-webpack-plugin';

export default {
  tools: {
    webpackChain(chain) {
      chain.plugin('eslint-plugin').use(ESLintPlugin, [
        {
          extensions: ['.js', '.ts', '.jsx', 'tsx', '.mjs'],
        },
      ]);
    },
  },
};
```

> 更详细的用法请参考 [eslint-webpack-plugin](https://github.com/webpack-contrib/eslint-webpack-plugin) 文档。

## 如何配置静态资源的 CDN 路径？

如果需要将 JS、CSS 等静态资源上传到 CDN 使用，那么可以通过 [output.assetPrefix](/api/config-output.html#outputassetprefix) 配置来设置静态资源的 URL 前缀。

```js
export default {
  output: {
    assetPrefix: 'https://cdn.example.com/assets/',
  },
};
```

## 如何清空 webpack 编译缓存？

默认情况下，Builder 的 webpack 编译缓存生成在 `./node_modules/.cache/webpack` 目录下。

如果需要清空本地的编译缓存，可以执行以下命令：

```bash
rm -rf ./node_modules/.cache
```

## 如何移除代码中的 console？

在生产环境构建时，我们可以移除代码中的 `console`，从而避免开发环境的日志被输出到生产环境。

Builder 默认提供了移除 console 的配置项，请查看 [performance.removeConsole](/api/config-performance.html#performance-removeconsole)。
