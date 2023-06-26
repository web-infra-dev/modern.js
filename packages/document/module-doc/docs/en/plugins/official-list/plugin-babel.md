# Babel Plugin

:::tip
Normally, we don't need to use Babel to transform our code, this plugin is only used as a downgrade.
:::

## Quick start

### Install

```bash
# npm
npm install @modern-js/plugin-module-babel -D

# yarn
yarn add @modern-js/plugin-module-babel -D

# pnpm
pnpm add @modern-js/plugin-module-babel -D
```

### Register

You can install the plugin with the following command:

```ts
import moduleTools, {  defineConfig } from '@modern-js/module-tools';
import { modulePluginBabel } from '@modern-js/plugin-module-babel';

export default defineConfig({
  plugins: [
    moduleTools(),
    modulePluginBabel(),
  ],
});
```

## Config

See [babel options](https://babeljs.io/docs/options).

Here is an example with `@babel/preset-env` configured

```ts
import moduleTools, {  defineConfig } from '@modern-js/module-tools';
import { modulePluginBabel } from '@modern-js/plugin-module-babel';

export default defineConfig({
  plugins: [
    moduleTools(),
    modulePluginBabel({
      presets: [['@babel/preset-env']],
    }),
  ],
});
```
