# @modern-js/libuild-plugin-babel
[![npm version](https://badge.fury.io/js/@modern-js%2Flibuild-plugin-babel.svg)](https://www.npmjs.com/package/@modern-js/libuild-plugin-babel)

A plugin for libuild to transform your code with babel.

## Tips
For compatibility with older applications, Libuild also supports user-defined Babel configurations, such as specifying additional babel plugins and babel presets, but please note: **Using Babel will result in slower builds, so do not use Babel unless necessary**. 

Neither `.babelrc` nor `babel.config.js` in the project root will take effect. If you need to use Babel, you need to configure it in the `libuild.config.ts` file.

## Usage

```ts
// libuild.config.ts
import { defineConfig } from '@modern-js/libuild';
import { babelPlugin } from '@modern-js/libuild-plugin-babel';

export = defineConfig({
  plugins:[
    babelPlugin( { /* options here */ })
  ]
})
```


## Options

See here for [babel transform options](https://babeljs.io/docs/en/options)