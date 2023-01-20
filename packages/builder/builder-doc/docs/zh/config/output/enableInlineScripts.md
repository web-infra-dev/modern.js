- Type: `boolean`
- Default: `false`

用来控制生产环境中是否用 `<script>` 标签将产物中的 script 文件（.js 文件）inline 到 HTML 中。

注意，如果开启了这个选项，那么 script 文件将不会被写入产物目录中，而只会以 inline 脚本的形式存在于 HTML 文件中。

### 示例

默认情况下，我们有这样的产物文件：

```bash
dist/html/main/index.html
dist/static/css/style.css
dist/static/js/main.js
```

开启 `output.enableInlineScripts` 选项后：

```js
export default {
  output: {
    enableInlineScripts: true,
  },
};
```

产物文件将变成：

```bash
dist/html/main/index.html
dist/static/css/style.css
```

同时，`dist/static/js/main.js` 文件将被 inline 到 `index.html` 中：

```html
<html>
  <body>
    <script>
      // content of dist/static/js/main.js
    </script>
  </body>
</html>
```
