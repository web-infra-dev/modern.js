- **类型：** `boolean`
- **默认值：** `true`

对于使用 Data URI 引入的 JavaScript 代码，是否采用 babel 进行编译。

比如以下代码：

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
