---
sidebar_label: bundleOptions
---

# buildConfig.bundleOptions

:::info 适用的工程方案
* 模块
:::
`bundleOptions` 用来定制 Bundle 构建相关的配置，当 `{ buildType: 'bundle' }` 的时候，该配置才会生效。

下面是一个配置示例：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: {
      // 必须要加上
      buildType: 'bundle',
      bundleOptions: {
        // entry 设置编译入口和输出文件的名称
        entry: {
          'index.min': './src/index.ts',
        },
        // splitting 设置是否进行代码分割
        splitting: true,
        // platform 设置构建环境
        platform: 'node',
        // minify 设置压缩代码使用的工具
        minify: 'terser',
        // externals 设置不打包的第三方依赖
        externals: ['react'],
        // skipDeps 设置是否跳过 package.json 里定义的依赖
        skipDeps: false,
      }
    },
  },
});
```

## entry

* 类型： `Record<string, string>`
* 默认值： `'{ index: './src/index.(t|j)s' }'`

设置打包模块的入口。对象的键会作为构建产物的文件名称，对象的值会作为入口（文件）的地址。

:::tip
对于[产物格式](/docs/apis/config/output/build-config/format)为 `umd` 的场景，对象的键还会作为全局变量名。例如下面的配置：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: {
      format: 'umd',
      buildType: 'bundle',
      bundleOptions: {
        entry: {
          'index': './src/index.ts',
        },
      }
    },
  },
});
```

此时输出的 `umd` 产物所有的导出，可以在浏览器中通过 `window.index` 的方式访问到。

当对象的键所对应的字符串中包含 `.`、`-` 字符的时候，其对应的全局变量名的命名会使用驼峰式命名法（Camel-Case）。例如上面例子中，当 `entry` 的键为 `'index.min'` 的时候，则全局变量名被转换为 `indexMin`。
:::

## splitting

* 类型： `boolean`
* 默认值： `false`

设置是否开启代码分割。这允许你将打包产物分割成独立的 `chunk`， `chunk` 的名称为上述 `entry` 的 `key`。

## platform

* 类型：`'node' | 'browser'`
* 默认值： `'node'`

用于设置构建环境。当值为 `node` 时构建工具会自动将 [Node](https://nodejs.org/en/) 的内置模块进行 external，而值为 `browser` 时则会打包这些模块。**为保证打包后的程序可以正常运行，你需要为内置模块提供 Polyfill 版本。**

## minify

* 类型：`false | 'terser' | 'esbuild'`
* 默认值： `false`

设置代码的压缩方式。支持 [terser](https://github.com/terser/terser) 和 [esbuild minify](https://esbuild.github.io/api/#minify) 两种压缩方式。当值为 `false` 的时候，关闭代码压缩。

## externals

* 类型： `(string | RegExp)[]`
* 默认值： `[]`

设置外置依赖。打包器将会跳过外置依赖的打包。

## skipDeps

* 类型： `boolean`
* 默认值： `true`

设置是否跳过第三方依赖的打包。默认开启，即**仅打包源代码**。当希望打包源代码及所有第三方依赖的时候，可以设置为 `false`。

:::tip 提示
当 `skipDeps: true` 的时候，其底层原理是：*将 `package.json` 里定义的 `dependencies`、`devDependencies`、`peerDependencies` 涉及到所有的依赖加到 [`externals`](#externals) 配置中。*

因此要确保**代码中不要存在未定义在 `package.json` 里的依赖**。
:::

