---
sidebar_position: 4
---

# 开发样式

Modern.js 对可复用模块项目提供了开发样式的支持。本章将要介绍如何在可复用模块项目中进行样式的开发。

## 内置样式与独立样式

### 什么是内置样式

在 Modern.js 中，对于在 `src` 目录下存在的样式文件称为**内置样式**。

在 Modern.js 中推荐的使用方式是直接在组件的代码文件（`.(j|t)sx`)）中导入它们。例如开发一个 `Button` 组件，包含以下文件：

- `./src/button.tsx`：包含组件的逻辑内容。
- `./src/button.css`：包含组件的内置样式。

那么可以在 `./src/button.tsx` 文件增加如下代码为 `Button` 组件增加样式：

``` tsx
import './button.css';
```

### 什么是独立样式

在 Modern.js 中，对于在 `styles` 目录下存在的样式文件称为 **独立样式**。

在 Modern.js 中独立样式的使用方式有以下两种：

- 在组件需要按需加载的情况下，通过 `babel-plugin-import` 导入独立样式的产物。
- 在应用项目中或其他可复用模块项目中，手动导入组件的独立样式的产物。

例如 `Button` 组件包含以下文件：

- `./src/button.tsx`：包含组件的逻辑内容。
- `./styles/button.css`：包含组件的独立样式。

在一个使用 `Button` 组件的应用项目中，有如下代码：

```tsx title=App.tsx
import Button from 'button';
```

那么可以增加以下代码为 `Button` 组件增加样式：

```tsx title=App.tsx {2}
import Button from 'button';
import 'button/dist/styles/button.css';
```

或者为应用项目的 Babel 配置增加 `babel-plugin-import` 插件，并增加以下配置：

``` javascript
{
  libraryName: "button",
  customName: () => {
    return 'button/dist/styles/button.css';
  }
}
```

### 开发内置样式与独立样式的注意点

在开发内置样式和独立样式的时候，有些限制需要注意。

1. 首先独立样式与内置样式不可以相互使用，即不可以在内置样式里引用独立样式的代码，也不可以在独立样式中引用内置样式的代码。
2. 其次独立样式文件不可以在 `src` 目录下的 JS(X)、TS(X) 文件中引用，因为需要样式与逻辑分离，因此会限制这样的使用方式。

### 内置样式与独立样式的构建产物

在样式编译构建的过程中，内置样式与独立样式的处理方式并不相同。

#### 对于内置样式的构建

**默认情况下不会对内置样式文件进行编译处理（将处理样式的工作交给使用组件的环境）**，如果需要对内置样式进行编译处理，则可以通过 `modern.config.js` 进行配置。

> 具体配置方式，可以阅读 API [output.importStyle](/docs/apis/config/output/import-style)

内置样式的构建产物的输出位置位于 `dist/js/styles/` 目录下，这与独立样式构建产物的位置不同。

:::info 补充信息
在 `dist/js/styles` 路径中，`dist`、`js`、`styles` 都可以分别通过 [output.path](/docs/apis/config/output/path)、[output.jsPath](/docs/apis/config/output/js-path)、[output.assetsPath](/docs/apis/config/output/assets-path) 配置进行修改。
:::

如果在组件文件`.(t|j)sx` 中引用这些文件，那么在构建成功后会修改**导入内置样式文件的路径**，将路径指向 `dist/js/styles/*`目录下内置样式文件的产物。

例如一个可复用模块项目有以下文件：

- `./src/index.ts`
- `./src/index.css`

其文件内容如下：

**./src/index.ts**

``` tsx
import './index.css';

export default function () {
  return 'hello world';
}
```

**./src/index.css**

``` css
.a {
  color: red;
  & .b {
    color: blue;
  }
}
```

:::info 补充信息
这里可以在 CSS 文件中使用嵌套规则，是因为可复用模块项目默认支持 [postcss-nesting](https://github.com/csstools/postcss-nesting) 功能。
:::

在执行构建命令 `pnpm run build` 构建命令后，会看到 `dist` 构建产物目录的目录结构如下：

``` md
.
├── js
│   ├── modern
│   │   └── index.js
│   ├── node
│   ├── styles
│   │   └── index.css
│   └── treeshaking
└── types
```

其中 `dist/js/modern/index.js` 的文件内容如下：

``` js
import "../styles/index.css";
export default function () {
  return 'hello world';
}
```

:::info 补充信息
关于为何存在 `dist/js/modern`、`dist/js/treeshaking`、`dist/js/node` 目录，请阅读 [构建可复用模块——构建 JS(X)、TS(X) 源码](/docs/guides/features/modules/build#构建-jsxtsx-源码)
:::

#### 对于独立样式的构建

独立样式在编译构建过程中会对样式进行编译处理。其构建产物的输出路径为 `dist/styles`。

:::info 补充信息
在 `dist/styles` 路径中，`dist`、`styles` 都可以分别通过[output.path](/docs/apis/config/output/path)、[output.assetsPath](/docs/apis/config/output/assets-path) 配置进行修改。
:::

例如为上一节中的组件新增 `styles/index.css` 独立样式文件，那么在执行构建命令 `pnpm run build` 后，会看到构建产物的目录结构如下：

``` md
.
├── js
│   ├── modern
│   ├── node
│   ├── styles
│   └── treeshaking
├── styles
│   └── index.css
└── types
```

## 使用 CSS 进行样式开发

可复用模块项目默认支持对 CSS 代码的开发，使用 **PostCSS** 对 CSS 代码进行编译处理。

## 使用 Less 进行样式开发

在可复用模块项目中如果需要使用 Less 开发样式，则需要通过微生成器开启对 Less 的功能支持。

我们可以在项目根目录下执行：

```
pnpm run new
```

然后按照如下选择：

```
? 请选择你想要的操作 启用可选功能
? 启用可选功能 启用 Less 支持
```

此时微生成器将为我们安装相应的依赖，当安装成功后，便可以在项目中使用 `*.less` 文件进行样式开发。

## 使用 SCSS/Sass 进行样式开发

在可复用模块项目中如果需要使用 SCSS/Sass 开发样式，则需要通过微生成器开启对 Sass 的功能支持。

我们可以在项目根目录下执行：

```
pnpm run new
```

然后按照如下选择：

```
? 请选择你想要的操作 启用可选功能
? 启用可选功能 启用 Sass 支持
```

此时微生成器将为我们安装相应的依赖，当安装成功后，便可以在项目中使用 `*.sass`、`*.scss` 文件进行样式开发。
