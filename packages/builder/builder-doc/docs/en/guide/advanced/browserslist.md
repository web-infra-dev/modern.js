# Browserslist

Builder supports using [Browserslist](https://browsersl.ist/) to specify which browsers should be supported in your Web application.

## What is Browserslist

Since different browsers support ECMAScript and CSS differently, developers need to set the correct browser range for web applications.

[Browserslist](https://browsersl.ist/) can specify which browsers your web application can run in, it provides a configuration for specifying browsers range. Browserslist has become a standard in the industry, it is used by libraries such as Autoprefixer, Babel, ESLint, PostCSS, SWC and Webpack.

When you specify a browser range through Browserslist, Builder will compile JavaScript and CSS code to the specified syntax, and inject the corresponding polyfill code. **When you only need to be compatible with modern browsers, the compilation process will introduce less compatible code and polyfills, and the performance of the page will be better.**

For example, when you need to be compatible with IE11 browser, Builder will compile the code to ES5 and inject the polyfill required by IE11 through `core-js`.

:::tip What is polyfill
A polyfill is a piece of code that provides the functionality of a newer feature to older browsers that do not support that feature natively. It is used to fill in the gaps in older browsers' implementations of web standards, allowing developers to use newer features safely without having to worry about whether or not they will work in older browsers. For example, if a browser does not support the Array.map() method, a polyfill can be used to provide that functionality, allowing code that uses `Array.prototype.flat()` to work in that browser. Polyfills are commonly used to ensure that web applications can work on a wide range of browsers, including older ones.
:::

## Set Browserslist

You can set the Browserslist value in the `package.json` or `.browserslistrc` file in the root directory of the current project.

### Example

Set via `browserslist` in `package.json`:

```json
{
  "browserslist": [
    "iOS 9",
    "Android 4.4",
    "last 2 versions",
    "> 0.2%",
    "not dead"
  ]
}
```

Set via a separate `.browserslistrc` file:

```
iOS 9
Android 4.4
last 2 versions
> 0.2%
not dead
```

### Use output.overrideBrowserslist config

In addition to the above standard usage, Builder also provides [output.overrideBrowserslist](/en/api/config-output.html#outputoverridebrowserslist) config, which can also set the value of Browserslist.

```ts
export default {
  output: {
    overrideBrowserslist: [
      'iOS 9',
      'Android 4.4',
      'last 2 versions',
      '> 0.2%',
      'not dead',
    ],
  },
};
```

When you build multiple targets at the same time, you can set different browser ranges for different targets. At this point, you need to set `overrideBrowserslist` to an object whose key is the corresponding build target.

For example to set different ranges for `web` and `node`:

```js
export default {
  output: {
    overrideBrowserslist: {
      web: ['iOS 9', 'Android 4.4', 'last 2 versions', '> 0.2%', 'not dead'],
      node: ['node >= 14'],
    },
  },
};
```

In most cases, it is recommended to use the `.browserslistrc` file rather than the `overrideBrowserslist` config. Because the `.browserslistrc` file is the official config file, it is more general and can be recognized by other libraries in the community.

## Commonly used Browserslist

The following are some commonly used Browserslist, you can choose according to your project type.

### Mobile H5 scene

The mobile H5 scene is mainly compatible with `iOS` and `Android` systems, usually we set Browserslist as:

```
iOS 9
Android 4.4
last 2 versions
0.2%
not dead
```

The above Browserslist will compile the code to the ES5 specification, which is compatible with most mobile scenarios on the market. For the detailed browsers list, please check [browserslist.dev](https://browserslist.dev/?q=aU9TIDksIEFuZHJvaWQgNC40LCBsYXN0IDIgdmVyc2lvbnMsID4gMC4yJSwgbm90IGRlYWQ%3D).

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/browserslist-dev-1222.png)

You can also choose to use the ES6 specification in the H5 scene, which will make the performance of the page better. The corresponding Browserslist is as follows:

```
iOS 10
Chrome 51
> 0.2%
not dead
not op_mini all
```

### Desktop PC scene

In the desktop PC scenario, if you need to be compatible with IE 11 browsers, you can set Browserslist to:

```
> 0.5%
not dead
Internet Explorer 11
```

The above Browserslist will compile the code to the ES5 specification. For the specific browser list, please check [browserslist.dev](https://browserslist.dev/?q=PiAwLjUlLCBub3QgZGVhZCwgSUUgMTE%3D).

If you don't need to be compatible with IE 11 browsers, you can adjust Browserslist to get a more performant output, such as setting it to browsers that supports native ES Modules:

```
chrome > 61
edge > 16
firefox > 60
safari > 11
ios_saf > 11
```

## Default Browserslist

Builder will set different default values of Browserslist according to [build target](/guide/basic/build-target.html), but we recommend that you explicitly set Browserslist in your project, which will make the compatible scope of the project more clear.

### Web Target

The default values of web target are as follows:

```bash
> 0.01%
not dead
not op_mini all
```

Under this browser range, JavaScript code will be compiled to ES5 syntax.

### Node Target

Node target will be compatible with Node.js 14.0 by default.

```bash
node >= 14
```

### Web Worker Target

The default Browserslist of the Web Worker target is consistent with the Web target.

```bash
> 0.01%
not dead
not op_mini all
```

### Modern Web Target

Modern Web target will be compatible with browsers that support [native ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) by default.

```bash
chrome > 61
edge > 16
firefox > 60
safari > 11
ios_saf > 11
```

## Query browser support

When developing, we need to know the browser support of certain features or APIs. At this time, we can check on the [caniuse](https://caniuse.com/) website.

For example, we need to know the browser support of `Promise`, just enter `Promise` in [caniuse](https://caniuse.com/), and you can see the following results:

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/caniuse-demo-1222.png)

As can be seen from the above table, `Promise` is natively supported in Chrome 33 and iOS 8, but not in IE 11.
