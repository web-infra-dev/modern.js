---
title: Compatibility
sidebar_position: 5
---

## Browserslist

Modern.js supports the `browserslist` field in the `package.json` file, or a `.browserslistrc` file to specify the target browser range covered by the project.

This value is used by ['@babel/preset-env'] (https://babeljs.io/docs/en/babel-preset-env) and ['autoprefixer'] (https://github.com/postcss/autoprefixer) to determine the JavaScript syntax features to be converted and the CSS browser prefix to be added.

The default value in Modern.js as follow:

```js
['> 0.01%', 'not dead', 'not op_mini all'];
```

You can learn how to customize the browserlist [here](https://github.com/browserslist/browserslist).

See Modern.js Builder docs to learn more [Browserlist](https://modernjs.dev/builder/zh/guide/advanced/browserslist.html) info.

:::note
Modern.js also supports configuring [output.override Browserlist](/docs/configure/app/output/override-browserslist) to override the default browserlist value.
:::

## Polyfill

### Polyfill At Compile

Modern.js inject the Polyfill code via [core-js] (https://github.com/zloirock/core-js) at compile time by default.

By default, the required Polyfill code will be introduced according to the settings of the Browserslist, so there is no need to worry about the Polyfill problem of the project source code and third-party dependencies, but because it contains some Polyfill code that is not used, the final bundle size may be increased.

:::info
For case where Polyfill is not required for third-party dependencies, you can set ['output.polyfill'](/docs/configure/app/output/polyfill) to `usage`, so that Babel compiles only Polyfill code based on the syntax used in the code.
:::

### Polyfill At Runtime

Modern.js also provides a runtime Polyfill solution based on browser [UA](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/User-Agent) information, which has the following advantages over Babel:

- It will not be inserted into the code, reducing the code .
- The same browser will share a Polyfill code. Therefore, with more and more projects, the UA-based Polyfill code will be delivered faster and faster.

exec `pnpm run new` to enable this features：

```bash
? 请选择你想要的操作 启用可选功能
? 启用可选功能 启用「基于 UA 的 Polyfill」功能
```

After executing the command, register the Polyfill plugin in `modern.config.ts`:

```ts title="modern.config.ts"
import polyfillPlugin from '@modern-js/plugin-polyfill';

// https://modernjs.dev/docs/apis/app/config
export default defineConfig({
  plugins: [..., polyfillPlugin()],
});
```

After configuring `output.polyfill` as `ua` and executing `pnpm run build & & pnpm run serve` to start the server, visiting the page can see that the HTML product contains the following script:

```js
<script src="/__polyfill__" crossorigin></script>
```

Visit the page `http://localhost:8080/__polyfill__` on Chrome 51 to see:

![ua-polyfill](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/ua-polyfill.png)

:::caution
This feature only works when using Modern.js built-in Web Server.
:::
