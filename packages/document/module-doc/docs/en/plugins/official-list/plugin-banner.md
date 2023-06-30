# Banner Plugin

Provide the ability to inject content at the top and bottom of each JS and CSS file.

## Quick Start

### Install

```bash
# npm
npm install @modern-js/plugin-module-banner -D

# yarn
yarn add @modern-js/plugin-module-banner -D

# pnpm
pnpm add @modern-js/plugin-module-banner -D
```

### Register

You can install the plugin with the following command:

```ts
import { moduleTools, defineConfig } from '@modern-js/module-tools';
import { modulePluginBanner } from '@modern-js/plugin-module-banner';

export default defineConfig({
  plugins: [
    moduleTools(),
    modulePluginBanner({
      banner: {
        js: '//comment',
        css: '/*comment*/',
      },
    }),
  ],
});
```

:::tip
Note: CSS comments do not support the `//comment` syntax. Refer to ["CSS Comments"](https://developer.mozilla.org/en-US/docs/Web/CSS/Comments)
:::

## Example

### Add copyright information at the top of a JS file

```ts
import { modulePluginBanner } from '@modern-js/plugin-module-banner';
import { moduleTools, defineConfig } from '@modern-js/module-tools';


const copyRight = `/*
 © Copyright 2020 xxx.com or one of its affiliates.
 * Some Sample Copyright Text Line
 * Some Sample Copyright Text Line
 * Some Sample Copyright Text Line
 * Some Sample Copyright Text Line
 * Some Sample Copyright Text Line
 * Some Sample Copyright Text Line
*/`;

export default defineConfig({
  plugins: [
    moduleTools(),
    modulePluginBanner({
      banner: {
        js: copyRight,
      },
    }),
  ],
});
```

## Configuration

* **Type**

```ts
type BannerOptions = {
  banner: {
    js?: string;
    css?: string;
  };
  footer?: {
    js?: string;
    css?: string;
  };
};
```

### banner

Add content at the top.

* `banner.js`: Add content at the top of a JS file.
* `banner.css`: Add content at the top of a CSS file.

### footer

Add content at the bottom.

* `footer.js`: Add content at the bottom of a JS file.
* `footer.css`: Add content at the bottom of a CSS file.
