- **Type:** `boolean`
- **Default:** `true`

This option is used to control whether to compile JavaScript code inside data URIs.

By default, Builder uses Babel or SWC to compile the code inside data URIs. For example, the following code:

```js
import x from 'data:text/javascript,export default 1;';

import 'data:text/javascript;charset=utf-8;base64,Y29uc29sZS5sb2coJ2lubGluZSAxJyk7';
```

### Example

Add the following config to disable:

```js
export default {
  source: {
    compileJsDataURI: false,
  },
};
```
