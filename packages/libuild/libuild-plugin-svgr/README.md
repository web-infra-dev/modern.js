# @modern-js/libuild-plugin-svgr
[![npm version](https://badge.fury.io/js/@modern-js%2Flibuild-plugin-svgr.svg)](https://www.npmjs.com/package/@modern-js/libuild-plugin-svgr)

A plugin for libuild to transform your svg to react component

## Usage

```ts
// libuild.config.ts
import { defineConfig } from '@modern-js/libuild';
import { svgrPlugin } from '@modern-js/libuild-plugin-svgr';

export = defineConfig({
  plugins:[
    svgrPlugin( { /* options here */ })
  ]
})
```

## Options

### include
The include option is a glob pattern to match the svg files you want to transform, default is `/\.(svg)$/`

### exclude
The exclude option is a glob pattern to match the svg files you don't want to transform, default is `undefined`

### other options

See here for [svgr options](https://react-svgr.com/docs/options/)