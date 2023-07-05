# @modern-js/friendly-errors-webpack-plugin

Transform and format webpack error into being more human-readable.

## Getting Started

Install the plugin by your favorite package manager, such as:

```shell
$ pnpm add -D @modern-js/friendly-errors-webpack-plugin
```

Then config it like:

```js
// webpack.config.js
const { FriendlyErrorsWebpackPlugin } = require('@modern-js/friendly-errors-webpack-plugin');

/** @type {import('webpack').Configuration} */
module.exports = {
  plugins: [
    new FriendlyErrorsWebpackPlugin(),
  ],
};
```

Now you will get output like belong.

![screenshot](https://lf3-static.bytednsdoc.com/obj/eden-cn/hrbzheh7lpqulduloj/c6f14fbfb6c8fe734df7979f079d18c36e11be9f.png)
