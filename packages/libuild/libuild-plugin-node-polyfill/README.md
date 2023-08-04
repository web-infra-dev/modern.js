# @modern-js/libuild-plugin-babel
[![npm version](https://badge.fury.io/js/@modern-js%2Flibuild-plugin-node-polyfill.svg)](https://www.npmjs.com/package/@modern-js/libuild-plugin-node-polyfill)

A plugin for libuild includes node polyfill

## Usage

```ts
// libuild.config.ts
import { defineConfig } from '@modern-js/libuild';
import { nodePolyfillPlugin } from '@modern-js/libuild-plugin-node-polyfill';

export = defineConfig({
  plugins:[
    nodePolyfillPlugin( { /* options here */ })
  ]
})
```


## Options

### excludes
The exclude option is a string array about polyfill modules, this modules will be not injected, default is `undefined`
