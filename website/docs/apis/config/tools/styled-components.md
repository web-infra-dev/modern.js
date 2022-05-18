---
sidebar_label: styledComponents
---

# tools.styledComponents

:::info 适用的工程方案
* MWA
:::

* 类型： `Object | Function`
* 默认值：见下方配置详情。

<details>
  <summary>styledComponents 配置详情</summary>


```js
{
  pure: true,
  displayName: true,
  ssr: false,
  transpileTemplateLiterals: true,
}
```

:::tip 提示
更多关于：<a href="https://github.com/styled-components/babel-plugin-styled-components" target="_blank">Styled Components 配置</a>。
:::
</details>

对应 [babel-plugin-styled-components](https://github.com/styled-components/babel-plugin-styled-components) 的配置。
值为 `Object` 类型时，利用 `Object.assign` 函数与默认配置合并。

```js title="modern.config.js"
export default defineConfig({
  tools: {
    styledComponents: {}
  }
});
```

值为 `Function` 类型时，默认配置作为参数传入，可以直接修改配置对象不返回任何东西，也可以返回一个值作为最终结果：

```js
export default defineConfig({
  tools: {
    styledComponents: opts => {}
  }
});
```
