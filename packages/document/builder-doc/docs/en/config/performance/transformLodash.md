- **Type:** `boolean`
- **Default:** `true`
- **Bundler:** `only support webpack`

Specifies whether to modularize the import of [lodash](https://www.npmjs.com/package/lodash) and remove unused lodash modules to reduce the code size of lodash.

This optimization is implemented using [babel-plugin-lodash](https://www.npmjs.com/package/babel-plugin-lodash) and [swc-plugin-lodash](https://github.com/web-infra-dev/swc-plugins/tree/main/crates/plugin_lodash) under the hood.

### Example

This option is enabled by default, and Builder will automatically redirects the code references of `lodash` to sub-paths.

For example:

```ts title="input.js"
import _ from 'lodash';
import { add } from 'lodash/fp';

const addOne = add(1);
_.map([1, 2, 3], addOne);
```

The transformed code will be:

```ts title="output.js"
import _add from 'lodash/fp/add';
import _map from 'lodash/map';

const addOne = _add(1);
_map([1, 2, 3], addOne);
```

### Disabling the Transformation

In some cases, the import transformation of `lodash` may generate unexpected code. In such cases, you can manually disable this optimization:

```js
export default {
  performance: {
    transformLodash: false,
  },
};
```
