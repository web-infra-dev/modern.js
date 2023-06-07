# 功能类问题

### 如何配置组件库按需引入？

如果需要配置组件库的按需引入，你可以通过 [source.transformImport](/api/config-source.html#sourcetransformimport) 配置，这个配置的能力等价于 [babel-plugin-import](https://www.npmjs.com/package/babel-plugin-import)。

```ts
export default {
  source: {
    transformImport: [
      {
        libraryName: 'xxx-components',
        libraryDirectory: 'es',
        style: true,
      },
    ],
  },
};
```

---

### 如何在编译过程中进行 ESLint 代码校验？

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

---

### 如何配置静态资源的 CDN 路径？

如果需要将 JS、CSS 等静态资源上传到 CDN 使用，那么可以通过 [output.assetPrefix](/api/config-output.html#outputassetprefix) 配置来设置静态资源的 URL 前缀。

```js
export default {
  output: {
    assetPrefix: 'https://cdn.example.com/assets/',
  },
};
```

---

### 如何清空 webpack 编译缓存？

默认情况下，Builder 的 webpack 编译缓存生成在 `./node_modules/.cache/webpack` 目录下。

如果需要清空本地的编译缓存，可以执行以下命令：

```bash
rm -rf ./node_modules/.cache
```

---

### 如何移除代码中的 console？

在生产环境构建时，我们可以移除代码中的 `console`，从而避免开发环境的日志被输出到生产环境。

Builder 默认提供了移除 console 的配置项，请查看 [performance.removeConsole](/api/config-performance.html#performanceremoveconsole)。

---

### 如何查看最终生成的 webpack / Rspack 配置?

#### 通过 inspect 命令查看

当你使用 Modern.js 等上层框架时，框架通常会提供 [inspect 命令](https://modernjs.dev/apis/app/commands.html) 用于查看项目最终生成的 Modern.js Builder 配置以及 webpack / Rspack 配置。

```bash
➜ npx modern inspect

Inspect config succeed, open following files to view the content:

  - Builder Config: /root/my-project/dist/builder.config.js
  - Rspack Config (web): /root/my-project/dist/rspack.config.web.js
```

#### 通过 Builder 调试模式查看

通过在执行构建时添加 `DEBUG=builder` 环境变量可开启 Builder 的[调试模式](/guide/debug/debug-mode.html)，此时会输出最终生成的 webpack 或 Rspack 配置到 dist 目录下。

```bash
➜ DEBUG=builder pnpm dev

debug   create context [1842.90 ms]
debug   add default plugins [1874.45 ms]
debug   add default plugins done [1938.57 ms]
...

Inspect config succeed, open following files to view the content:

  - Builder Config: /root/my-project/dist/builder.config.js
  - Rspack Config (web): /root/my-project/dist/rspack.config.web.js
```
