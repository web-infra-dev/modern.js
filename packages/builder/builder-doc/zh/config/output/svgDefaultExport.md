- Type: `url` | `component`
- Default: `url`

`output.svgDefaultExport` 可以用来配置 Svg 文件的默认导出。

当 `output.svgDefaultExport` 配置为 `url` 时，Svg 文件的默认导出是文件的 URL。例如：

```js
import logo from './logo.svg';

console.log(logo); // => 资源 url
```

当 `output.svgDefaultExport` 配置为 `component` 时，Svg 文件的默认导出是文件的 React 组件。例如：

```js
import Logo from './logo.svg';

console.log(Logo); // => React 组件
```

此时，你也可以通过指定 `?url` 的 query 来导入 url，比如：

```js
import logo from './logo.svg?url';

console.log(logo); // => 资源 url
```
