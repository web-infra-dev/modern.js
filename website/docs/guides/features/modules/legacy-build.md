---
sidebar_position: 6.5
---

# 构建可复用模块（即将移除）
本章将要讲解在可复用模块项目中编译构建的相关内容。

:::warning
此部分内容在下个大版本将会移除，涉及到的相关功能在当前版本仍然支持，下个大版本有可能保留部分功能。

推荐阅读 【[如何构建模块](/docs/guides/features/modules/build)】。
:::

## 运行构建任务

在可复用模块项目中，可以在项目根目录下执行如下命令运行构建任务：

```
pnpm run build
```

## 构建产物的目录结构

假设项目的目录结构如下：

```md
.
├── src/
|   ├── index.css
│   └── index.ts
├── styles/
|   └── index.css
| ...
```

当执行 `pnpm run build` 构建成功后 `dist` 目录的结构如下：

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/guides/dist-struct.png)

接下来针对构建产物讲解一下 `dist` 各个目录的用途以及在构建过程中做了哪些事情。

### 构建 JS(X)、TS(X) 源码

在可复用模块的构建过程中，会对 `src` 目录下的 JS(X)、TS(X) 文件进行构建，构建的产物会输出到 `dist/js/modern`、`dist/js/treeshaking`、`dist/js/node` 这三种目录下。每种目录可能会包含支持不同 JS 语法以及模块化系统的代码。

默认情况下，这三个目录对应的语法以及模块化系统映射如下：

- `dist/js/modern` 对应 `ES6`的语法以及使用 `ES Module` 模块化系统的构建产物。
- `dist/js/treeshaking` 对应 `ES5`的语法以及使用 `ES Module` 模块化系统的构建产物。
- `dist/js/modern` 对应 `ES6`的语法以及使用 `CommonJS` 模块化系统的构建产物。

如果需要修改生成产物的语法和使用的模块化系统，则可以通过 [output.packageMode](/docs/apis/config/output/package-mode) 以及 [output.packageFields](/docs/apis/config/output/package-fields) 配置来修改。

:::info 补充信息
虽然默认生成三种构建产物，但是可以通过配置可以生成两种，甚至一种构建产物。根据配置不同，生成的产物结构也会有所不同。例如当配置 `output.packageMode = 'node-js'` 的时候，构建产物中只会包含 `dist/js/modern` 以及 `dist/js/node` 两个目录。
:::

### 类型文件生成

在可复用模块的构建过程中，如果项目是一个 TypeScript 项目，那么会在 `dist/types` 目录下生成 `src` 目录里 TS 文件对应的 `*.d.ts` 类型文件。

我们可以在项目的 `package.json` 中的 `types` 字段使用它：

```json
	@@ -62,52 +50,32 @@ pnpm run build
}
```

### 构建样式

在可复用模块的构建过程中，会对 `src`、`styles`（如果存在的话） 目录下的样式代码进行编译处理。

构建成功后：

- 对于 `src` 目录下的样式代码其构建产物会被输出到 `dist/js/styles` 目录下
- 对于 `styles` 目录下的样式代码其构建产物会被输出到 `dist/styles` 目录下。

### 静态资源文件处理

在可复用模块的构建过程中，对于 `src` 目录下的非源码文件会进行复制处理，它们会被复制到 `dist/js/styles` 目录下面。如果在 JS(X)、TS(X) 代码中导入了这些静态文件，则会修改原本的指向路径。

> 所谓源码文件是指 JS、CSS 这类文件。

例如有如下项目结构：

```md
.
├── src/
|   ├── mock.json
│   └── index.ts
| ...
```

如果在 `./src/index.ts` 文件的内容如下：

``` ts
import mock from './mock.json';

export default function () {
  console.info(mock);
  return 'hello world';
}
```

则在构建成功后，`dist` 的目录结构如下：

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/guides/assets-dist.png)

其中 `./dist/js/modern/index.js` 文件的内容如下：

``` js
import mock from "../styles/mock.json";
export default function () {
  console.info(mock);
  return 'hello world';
}
```
