# 深入理解构建

在【基础使用】的部分，我们已经知道可以通过 `buildConfig` 配置对项目的输出产物进行修改。`buildConfig` 不仅描述了产物的一些特性，同时还为构建产物提供了一些功能。

:::tip{title=注意}
如果你还不清楚 `buildConfig` 是什么，建议花一些时间通过下面的链接了解一下：

* 【[修改输出产物](/zh/guide/modify-output-product)】
:::

而在本章里我们将要深入理解某些构建配置的使用以及了解执行 `modern build` 命令的时候发生了什么。

## 深入理解 `buildConfig`

### Bundle 和 Bundleless

那么首先我们来理解一下 Bundle 和 Bundleless。

所谓 Bundle 是指对构建产物进行打包，构建产物可能是一个文件，也有可能是基于一定的[代码拆分策略](https://esbuild.github.io/api/#splitting)得到的多个文件。

而 Bundleless 则是指对每个源文件单独进行编译构建，但是并不将它们打包在一起。每一个产物文件都可以找到与之相对应的源码文件。**Bundleless 构建的过程，也可以理解为仅对源文件进行代码转换的过程**。

在 `buildConfig` 中可以通过 [`buildConfig.buildType`](/zh/api/build-config#buildtype) 来指定当前构建任务是 Bundle 还是 Bundleless。

### `input` 与 `sourceDir` 的关系

[`buildConfig.input`](/zh/api/build-config#input) 用于指定读取源码的文件路径或者目录路径，其默认值在 Bundle 和 Bundleless 构建过程中有所不同：

* 当 `buildType: 'bundle'` 的时候，`input` 默认值为 `['src/index.ts']`
* 当 `buildType: 'bundleless'` 的时候，`input` 默认值为 `['src']`
> 实际上，在 `buildType: 'bundle'` 的时候，构建工具会检测是否存在符合 `src/index.(j|t)sx?` 这个名称规则的文件，并将其作为入口文件。

:::warn{title=注意}
建议不要在 Bundleless 构建过程中指定多个源码文件目录，可能出现不符合预期的结果。目前多个源码目录的 Bundleless 构建还处于不稳定阶段。
:::

从默认值上我们可以知道：**Bundle 构建一般可以指定文件路径作为构建的入口，而 Bundleless 构建则更期望使用目录路径寻找源文件**。

#### `input` 的对象模式

在 Bundle 构建过程中，除了将 `input` 设置为一个数组，也可以将它设置为一个对象。**通过使用对象的形式，我们可以修改构建产物输出的文件名称**。那么对于下面的例子，`./src/index.ts` 对应的构建产物文件路径为 `./dist/main.js`。

``` tsx modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
    buildConfig: {
        input: {
            main: ['./src/index.ts'],
        },
        outdir: './dist',
    },
});
```

而在 Bundleless 构建过程中，虽然同样支持这样的使用方式，但是并不推荐。

#### `sourceDir`

[`sourceDir`](/zh/api/build-config#sourcedir) 用于指定源码目录，它主要与以下两个内容有关系：

* 类型文件生成
* 指定构建过程中的 [`outbase`](https://esbuild.github.io/api/#outbase)

一般来说：

* **在 Bundleless 构建过程中，`sourceDir` 与 `input` 的值要保持一致，它们的默认值都是 `src`**。
* 在 Bundle 构建过程中，很少需要使用 `sourceDir`。

### 类型文件

[`buildConfig.dts`](/zh/api/build-config#dts) 配置主要用于类型文件的生成。

#### 关闭类型生成

默认情况下类型生成功能是开启的，如果需要关闭的话，可以：

```ts ./modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    dts: false
  }
});
```

#### 打包类型文件

在 `buildType: 'bundleless'` 的时候，类型文件的生成是使用项目的 `tsc` 命令来完成生产。

模块工程解决方案同时还支持对类型文件进行打包，不过使用该功能的时候需要注意：

* 一些第三方依赖存在导致打包出现错误的语法，因此对于这种情况，需要手动通过 [`buildConfig.externals`](/zh/api/build-config#externals) 将这些包排除打包的范围。
* 无法处理第三方包的类型文件指向源码的情况。

#### 别名转换

在 Bundleless 构建过程中，源码里可能会出现别名，例如：

```ts ./src/index.ts
import utils from '@common/utils';
```

正常来说，使用 `tsc` 生成的产物类型文件也会包含这些别名。不过 module-tools 会对这些类型文件的别名进行转换处理：

* 对于类似 `import '@common/utils'` 或者 `import utils from '@common/utils'` 这样形式的代码可以进行别名转换
* 对于类似 `export { utils } from '@common/utils'` 这样形式的代码可以进行别名转换。

然而也存在一些情况，目前还无法处理：

* 对于类似 `Promise<import('@common/utils')>` 这样形式的输出类型目前无法进行转换。

####


## 构建过程

当执行 `modern build` 命令的时候，会发生

* 根据 `buildConfig.outdir` 清理产物目录
* 编译 `js/ts` 生成 Bundle/Bundleless 的 JS 构建产物
* 使用 `tsc` 生成 Bundle/Bundleless 的类型文件
* 处理 Copy 任务

## 构建报错

基于以上我们了解到的，当发生构建报错的时候，我们可以在终端看到下面的内容：

**js/ts 构建的报错：**
``` bash
error  ModuleBuildError:

╭───────────────────────╮
│ bundle failed:        │
│  - format is "cjs"    │
│  - target is "esnext" │
╰───────────────────────╯

Detailed Information:
```

**类型文件生成过程的报错：**

``` bash
error   ModuleBuildError:

bundle DTS failed:
```

对于 `js/ts` 构建错误，我们可以从报错信息中得到以下信息：

* 通过 `'bundle failed:'` 来判断报错的是 Bundle 构建还是 Bundleless 构建？
* 构建过程的 `format` 是什么？
* 构建过程的 `target` 是什么？
* 具体的报错信息。
