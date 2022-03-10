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

当需要自定义 Tailwind CSS 的 [theme](https://tailwindcss.com/docs/theme) 配置的时候，可以在配置 [`source.designSystem`](/docs/apis/config/source/design-system) 中修改，例如，颜色主题中增加一个 `primary`：

```js title="package.json"
{
  "modernConfig": {
    "source": {
      "designSystem": {
        "extend": {
          "colors": {
            "primary": "#5c6ac4"
          }
        }
      }
    }
  }
}
```

当需要对 Tailwind CSS 做 [theme](https://tailwindcss.com/docs/theme) 以外的其他特殊配置时，可以在 [`tools.tailwindcss`](/docs/apis/config/tools/tailwindcss) 中配置，例如设置 `variants`：

```js title="package.json"
{
  "modernConfig": {
    "tools": {
      "tailwindcss": {
        "variants": {
          "extend": {
            "backgroundColor": ["active"]
          }
        }
      }
    }
  }
}
```
