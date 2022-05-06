---
sidebar_position: 1
---

# CSS-in-JS

CSS-in-JS 是一种可以将 CSS 样式写在 JS 文件里的技术。Modern.js 集成了社区常用的 CSS-in-JS 实现库 [styled-components](https://styled-components.com/)，它使用 JavaScript 的新特性 [Tagged template](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) 编写组件的 CSS 样式。可以直接从 `@modern-js/runtime/styled` 引入 [styled-components](https://styled-components.com/) 的 API 进行使用。

当需要编写一个内部字体为红色的 `div` 组件时，可以如下实现：

```js
import styled from '@modern-js/runtime/styled'

const RedDiv = styled.div`
  color: red;
`
```

当需要根据组件的 `props` 动态设置组件样式时，例如 `props` 的属性 `primary` 为 `true` 时，按钮的颜色为白色，其他情况为红色，实现代码如下：

```js
import styled from '@modern-js/runtime/styled'

const Button = styled.button`
  color: ${props => props.primary ? "white" : "red"};
  font-size: 1em;
`
```

关于 styled-components 的更多用法，请参考【[styled-components 官网](https://styled-components.com/)】。

:::info 补充信息
Modern.js 内部使用了 Babel 插件 [babel-plugin-styled-components](https://github.com/styled-components/babel-plugin-styled-components)，可以通过 [`tools.styledComponents`](/docs/apis/config/tools/styled-components) 对插件进行配置。
:::

:::tip 提示
如果需要使用 [styled-jsx](https://www.npmjs.com/package/styled-jsx)、[Emotion](https://emotion.sh/) 等其他 CSS-in-JS 库，需要先安装对应库的依赖。具体使用方式请参考对应库的官网。
:::
