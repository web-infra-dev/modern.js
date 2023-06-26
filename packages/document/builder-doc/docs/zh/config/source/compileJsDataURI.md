- **类型：** `boolean`
- **默认值：** `true`

该选项用于控制是否编译 data URI 中的 JavaScript 代码。

默认情况下，Builder 会使用 Babel 或 SWC 对 data URI 中的代码进行编译。比如以下代码：

```js
import x from 'data:text/javascript,export default 1;';

import 'data:text/javascript;charset=utf-8;base64,Y29uc29sZS5sb2coJ2lubGluZSAxJyk7';
```

### 示例

添加以下配置来关闭：

```js
export default {
  source: {
    compileJsDataURI: false,
  },
};
```
