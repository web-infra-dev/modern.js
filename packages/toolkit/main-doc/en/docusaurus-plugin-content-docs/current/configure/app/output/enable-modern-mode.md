---
sidebar_label: enableModernMode
---

# output.enableModernMode

* Type: `boolean`
* Default: `false`

Modern.js default value to build JS products with Polyfill for older browsers. After opening this configuration, you can automatically build JS products that are not degraded for modern browser syntax in the production environment. The product filename format is `[name].[hash]-es6/js`.

For example, configure the following configuration:

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    enableModernMode: true,
  },
});
```

After executing the `build` command, modern is packaged in addition to the normal Client packaging, and the `dist/static/js` directory will generate es6 related products.

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/output-enable-modern-build.jpeg)

After executing the `start` command, use the latest version Chrome browser access, and observe that the requested JS resource in the Network is an es6 product.

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/output-enable-modern-network.jpeg)

:::info
For more information, see [Client side compatibility](/docs/guides/advanced-features/compatibility)。
:::
