- Type: `boolean`
- Default: `false`

Whether to remove the locales of [moment.js](https://momentjs.com/).

`moment.js` contains a lot of locales by default, which will increase the bundle size.

When `moment.js` is used in the project, it is recommended to enable this option to automatically exclude all locales:

```js
export default {
  performance: {
    removeMomentLocale: true,
  },
};
```

Once enabled, you can load a specific locale via:

```js
import moment from 'moment';
import 'moment/locale/zh-cn';

moment.locale('zh-cn');
```
