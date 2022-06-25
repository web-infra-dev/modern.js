---
sidebar_position: 2
---

# Tailwind CSS

[Tailwind CSS](https://tailwindcss.com/) 是一个以 Utility Class 为基础的 CSS 框架和设计系统，可以快速地为组件添加常用样式，同时支持主题样式的灵活扩展。在 Modern.js 中使用 [Tailwind CSS](https://tailwindcss.com/)，只需要在项目根目录下执行 `pnpm run new` 并开启。

按照如下进行选择：

```bash
? 请选择你想要的操作: 启用可选功能
? 启用可选功能: 启用 Tailwind CSS 支持
```

使用时在入口的根组件(如 `src/App.jsx`)添加如下代码：

```js
import 'tailwindcss/base.css';
import 'tailwindcss/components.css';
import 'tailwindcss/utilities.css';
```

然后即可在各个组件中使用 Tailwind CSS 提供的 Utility Class 了。

:::info 补充信息
根据不同需求，可以选择性的导入 Tailwind CSS 提供的 CSS 文件。由于使用 `@taiwind` 与直接导入 CSS 文件的作用等价，因此关于 Tailwind CSS 提供的 CSS 文件的用途，可以参考 [`@tailwind` 的使用](https://tailwindcss.com/docs/functions-and-directives#tailwind) 文档中注释里的内容。
:::

当需要自定义 Tailwind CSS 的 [theme](https://tailwindcss.com/docs/theme) 配置的时候，可以在配置 [`source.designSystem`](/docs/apis/config/source/design-system) 中修改，例如，颜色主题中增加一个 `primary`：

```js title="modern.config.js"
export default defineConfig({
  source: {
    designSystem: {
      extend: {
        colors: {
          primary: '#5c6ac4',
        },
      },
    },
  },
});
```

当需要对 Tailwind CSS 做 [theme](https://tailwindcss.com/docs/theme) 以外的其他特殊配置时，可以在 [`tools.tailwindcss`](/docs/apis/config/tools/tailwindcss) 中配置，例如设置 `variants`：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    tailwindcss: {
      variants: {
        extend: {
          backgroundColor: ['active'],
        },
      },
    },
  },
});
```

## 使用 [`Twin`](https://github.com/ben-rogerson/twin.macro) 库

在上一章中介绍了什么是 CSS-in-JS 以及社区常用的 CSS-in-JS 库 [styled-components](https://styled-components.com/)。这一部分将要介绍如何通过 [`Twin`](https://github.com/ben-rogerson/twin.macro) 在 CSS-in-JS 中使用 [Tailwind CSS](https://tailwindcss.com/)。使用 [`Twin`](https://github.com/ben-rogerson/twin.macro) 可以更容易在 CSS-in-JS 的代码中使用 Tailwind CSS。[`Twin`](https://github.com/ben-rogerson/twin.macro) 对于自己的描述是：

> *Twin blends the magic of Tailwind with the flexibility of css-in-js*

在开启「Tailwind CSS 支持」的功能后，首先需要安装 [`Twin`](https://github.com/ben-rogerson/twin.macro) 依赖:

``` bash
# package manager is `pnpm`
pnpm add twin.macro -D

# package manager is `yarn`
yarn add twin.macro -D
```

当项目安装 `twin.macro` 依赖后，Modern.js 会检测到该依赖并对内置的 `babel-plugin-macro` 增加 `twin.macro` 相关的配置。因此在安装完依赖后，无需手动配置。下面是一个简单使用 `twin.macro` 的示例：

``` js
import tw from 'twin.macro'

const Input = tw.input`border hover:border-black`
```

:::tip 提示
如果在运行过程中出现了 `MacroError: /project/App.tsx` 错误的时候，有可能是缺少 `twin.macro` 依赖导致的。
:::

更多的使用方式可以参考 `twin.macro` 的 [文档](https://github.com/ben-rogerson/twin.macro/blob/master/docs/index.md)。

`twin.macro` 默认会读取项目目录下的 `tailwindcss.config.js` 文件，或者通过 `babel-plugin-macro` 上的 [`twin.config`](https://github.com/ben-rogerson/twin.macro/blob/master/docs/options.md#options) 指定的文件路径读取 Tailwind CSS 配置。不过在 Modern.js 中不需要进行这些额外配置。

当在 `modern.config.ts` 文件中通过 [`source.designSystem`](/docs/apis/config/source/design-system) 和  [`tools.tailwindcss`](/docs/apis/config/tools/tailwindcss) 对 Tailwind CSS 进行配置的时候，这些配置也会对 `twin.macro` 生效。
> 当为项目配置 Tailwind CSS 的时候，[`source.designSystem`](/docs/apis/config/source/design-system) 和  [`tools.tailwindcss`](/docs/apis/config/tools/tailwindcss) 这两个配置的组合等价于单独配置了一个 `tailwindcss.config.js` 文件。
> 其中[`source.designSystem`](/docs/apis/config/source/design-system)等效于 Tailwind CSS 的 [`theme`](https://v2.tailwindcss.com/docs/configuration#theme) 配置。


