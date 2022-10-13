- Type: `boolean`
- Default: `false`

[moment.js](https://momentjs.com/) 默认包含了大量的语言包文件，会导致打包后的包体积增大。

当项目中使用了 `moment.js` 时，推荐开启此选项，自动排除所有的语言包文件：

```js
export default {
  performance: {
    removeMomentLocale: true,
  },
};
```

开启后，可以通过以下方式来加载语言包文件：

```js
import moment from 'moment';
import 'moment/locale/zh-cn';

moment.locale('zh-cn');
```
