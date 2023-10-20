- **类型：**

```ts
type EnableInlineScripts =
  | boolean
  | RegExp
  | ((params: { size: number; name: string }) => boolean);
```

- **默认值：** `false`
- **打包工具：** `仅支持 webpack`

用来控制生产环境中是否用 `<script>` 标签将产物中的 script 文件（.js 文件）inline 到 HTML 中。

注意，如果开启了这个选项，那么 script 文件将不会被写入产物目录中，而只会以 inline 脚本的形式存在于 HTML 文件中。

:::tip
当使用约定式路由时，如果开启了这个选项，需要将 [output.splitRouteChunks](https://modernjs.dev/configure/app/output/splitRouteChunks.html) 设置为 false。
:::

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

### 通过正则匹配

当你需要内联产物中的一部分 JS 文件时，你可以将 `enableInlineScripts` 设置为一个正则表达式，匹配需要内联的 JS 文件的 URL。

比如，将产物中的 `main.js` 内联到 HTML 中，你可以添加如下配置：

```js
export default {
  output: {
    enableInlineScripts: /\/main\.\w+\.js$/,
  },
};
```

:::tip
生产环境的文件名中默认包含了一个 hash 值，比如 `static/js/main.18a568e5.js`。因此，在正则表达式中需要通过 `\w+` 来匹配 hash。
:::

### 通过函数匹配

你也可以将 `output.enableInlineScripts` 设置为一个函数，函数接收以下参数：

- `name`：文件名，比如 `static/js/main.18a568e5.js`。
- `size`：文件大小，单位为 byte。

比如，我们希望内联小于 10KB 的资源，可以添加如下配置：

```js
export default {
  output: {
    enableInlineScripts({ size }) {
      return size < 10 * 1000;
    },
  },
};
```
