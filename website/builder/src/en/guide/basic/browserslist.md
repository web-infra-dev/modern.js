# Browserslist

Builder supports using [browserslist](https://browsersl.ist/) to specify which browsers should be supported in your Web application.

## What is Browserslist

Since different browsers support ECMAScript and CSS differently, developers need to set the correct browser range for web applications.

[browserslist](https://browsersl.ist/) can specify which browsers your web application can run in, it provides a configuration for specifying browsers range. Browserslist has become a standard in the industry, it is used by libraries such as Autoprefixer, Babel, ESLint, PostCSS, SWC and Webpack.

When you specify a browser range through `browserslist`, Builder will compile JavaScript and CSS code to the specified syntax, and inject the corresponding Polyfill code.

For example, when you need to be compatible with IE11 browser, Builder will compile the code to ES5 and inject the Polyfill required by IE11 through `core-js`.

:::tip What is Polyfill
A polyfill is a piece of code that provides the functionality of a newer feature to older browsers that do not support that feature natively. It is used to fill in the gaps in older browsers' implementations of web standards, allowing developers to use newer features safely without having to worry about whether or not they will work in older browsers. For example, if a browser does not support the Array.map() method, a polyfill can be used to provide that functionality, allowing code that uses `Array.prototype.flat()` to work in that browser. Polyfills are commonly used to ensure that web applications can work on a wide range of browsers, including older ones.
:::

## Set Browserslist

You can set the browserslist value in the `package.json` or `.browserslistrc` file in the root directory of the current project.

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

In addition to the above standard usage, Builder also provides [output.overrideBrowserslist](/en/api/config-output.html#output-overridebrowserslist) config, which can also set the value of browserslist.

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

## Default Browserslist

Builder will set different default values of Browserslist according to [build target](/guide/basic/build-target.html).

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

The default browserslist of the Web Worker target is consistent with the Web target.

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
