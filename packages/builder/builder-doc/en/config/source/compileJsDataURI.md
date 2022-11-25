- Type: `boolean`
- Default: `true`

Whether to compile JavaScript code imported via Data URI.

Such as:

```js
import x from 'data:text/javascript,export default 1;';

import 'data:text/javascript;charset=utf-8;base64,Y29uc29sZS5sb2coJ2lubGluZSAxJyk7';
```

#### Example

Add the following config to disable:

```js
export default {
  source: {
    compileJsDataURI: false,
  },
};
```
