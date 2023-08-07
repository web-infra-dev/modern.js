- **类型：** `boolean`
- **默认值：** `true`
- **打包工具：** `仅支持 webpack`

是否模块化 [lodash](https://www.npmjs.com/package/lodash) 的导入，删除未使用的 lodash 模块，从而减少 lodash 代码体积。

这项优化基于 [babel-plugin-lodash](https://www.npmjs.com/package/babel-plugin-lodash) 和 [swc-plugin-lodash](https://github.com/web-infra-dev/swc-plugins/tree/main/crates/plugin_lodash) 实现。

### 示例

该选项默认开启，Builder 会自动将 `lodash` 的代码引用指向子路径。

比如：

```ts title="input.js"
import _ from 'lodash';
import { add } from 'lodash/fp';

const addOne = add(1);
_.map([1, 2, 3], addOne);
```

转换后的代码为：

```ts title="output.js"
import _add from 'lodash/fp/add';
import _map from 'lodash/map';

const addOne = _add(1);
_map([1, 2, 3], addOne);
```

### 关闭转换

在个别情况下，`lodash` 的 import 转换可能会生成不符合预期的代码，此时你可以手动关闭这项优化：

```js
export default {
  performance: {
    transformLodash: false,
  },
};
```
