- **类型：** `string | Function`
- **默认值：**

定义 HTML 模板的文件路径，对应 [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin) 的 `template` 配置项。

### 示例

使用自定义的 HTML 模板文件替代默认模板，可以添加如下设置：

```js
export default {
  html: {
    template: './static/index.html',
  },
};
```

详细用法可参考 [Rsbuild - html.template](https://rsbuild.dev/zh/config/html/template)。
