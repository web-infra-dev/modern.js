# @modern-js/libuild-plugin-babel-preset
[![npm version](https://badge.fury.io/js/@modern-js%2Flibuild-plugin-babel-preset.svg)](https://www.npmjs.com/package/@modern-js/libuild-plugin-babel-preset)

A plugin for libuild to transform your code with @babel/preset-react, @babel/preset-typescript and babel-plugin-import

## Tips

For compatibility with older applications, Libuild also supports user-defined Babel configurations, such as specifying additional babel plugins and babel presets, but please note: **Using Babel will result in slower builds, so do not use Babel unless necessary**. 

Neither `.babelrc` nor `babel.config.js` in the project root will take effect. If you need to use Babel, you need to configure it in the `libuild.config.ts` file.

## Usage

```ts
// libuild.config.ts
import { defineConfig } from '@modern-js/libuild';
import { babelPresetPlugin } from '@modern-js/libuild-plugin-babel-preset';

export = defineConfig({
  plugins: [
    babelPresetPlugin({
      import: [
        {
          libraryName: 'antd',
          style: false,
        }
        // babel-plugin-import options
      ], 
      react: {} // @babel/preset-react options
    }, {
      // babel-core transform options
    })
  ]
})
```

## Options

### preset options
`react`: [babel-preset-react](https://babeljs.io/docs/en/babel-preset-react#options)

`import`: [babel-plugin-import](https://github.com/umijs/babel-plugin-import#options)

### transform options
See here for [babel transform options](https://babeljs.io/docs/en/options)