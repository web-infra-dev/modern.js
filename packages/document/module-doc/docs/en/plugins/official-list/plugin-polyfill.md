# Polyfill Plugin

:::tip
Normally, we don't need to inject polyfill for npm packages, this step should be done on the web application framework side, but in some scenarios we need to inject polyfill in order to make our library run directly in low version browsers.

Note that this plugin does not transform your code syntax, it only injects polyfill for unsupported functions used in your code, importing them as normal functions instead of polluting the global. You need to install the `core-js-pure` dependency.

:::

## Quick start

### Install

```bash
# npm
npm install @modern-js/plugin-module-polyfill -D

# yarn
yarn add @modern-js/plugin-module-polyfill -D

# pnpm
pnpm add @modern-js/plugin-module-polyfill -D
```

### Register

In Module Tools, you can register plugins in the following way:

```ts
import moduleTools, { defineConfig } from '@modern-js/module-tools';
import { modulePluginPolyfill } from '@modern-js/plugin-module-polyfill';

export default defineConfig({
  plugins: [
    moduleTools(),
    modulePluginPolyfill(),
  ],
});
```

## Config

* **Type**

```ts
type options = {
  targets?: Record<string, string> | string;
}
```

### targets

See [Babel target](https://babeljs.io/docs/options#targets).

This is a example.

```ts
import moduleTools, { defineConfig } from '@modern-js/module-tools';
import { modulePluginPolyfill } from '@modern-js/plugin-module-polyfill';

export default defineConfig({
  plugins: [
    moduleTools(),
    modulePluginPolyfill({
      targets: "> 0.25%, not dead"
    }),
  ],
});
```
