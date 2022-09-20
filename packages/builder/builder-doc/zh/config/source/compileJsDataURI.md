- Type: `boolean`
- Default: `false`

是否使用 babel 编译通过 import Data URI 引入的 JavaScript 代码。

比如以下代码：

```js
import x from 'data:text/javascript,export default 1;';

import 'data:text/javascript;charset=utf-8;base64,Y29uc29sZS5sb2coJ2lubGluZSAxJyk7';
```

#### 示例

添加以下配置来开启：

```js
export default {
  source: {
    compileJsDataURI: true,
  },
};
```
