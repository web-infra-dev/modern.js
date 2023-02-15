- **类型：** `boolean`
- **默认值：** `false`
- **打包工具：** `仅支持 webpack`

用来控制生产环境中是否用 `<style>` 标签将产物中的 style 文件（.css 文件）inline 到 HTML 中。

注意，如果开启了这个选项，那么 style 文件将不会被写入产物目录中，而只会以 inline 样式的形式存在于 HTML 文件中。

### 示例

默认情况下，我们有这样的产物文件：

```bash
dist/html/main/index.html
dist/static/css/style.css
dist/static/js/main.js
```

开启 `output.enableInlineStyles` 选项后：

```js
export default {
  output: {
    enableInlineStyles: true,
  },
};
```

产物文件将变成：

```bash
dist/html/main/index.html
dist/static/js/main.js
```

同时，`dist/static/css/style.css` 文件将被 inline 到 `index.html` 中：

```html
<html>
  <head>
    <style>
      /* content of dist/static/css/style.css */
    </style>
  </head>
  <body>
  </body>
</html>
```
