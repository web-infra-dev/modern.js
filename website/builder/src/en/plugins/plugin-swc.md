# SWC plugin

[SWC](https://swc.rs/) (Speedy Web Compiler) is a transformer and minizer for `Javascript` and `Typescript` based on `Rust`. `SWC` can provide the same abilities with `Babel`, and it's more than 10x faster than `Babel`.

`Modern.js builder` has a out-of-box plugin for `SWC`, power your Web application with polyfill and minification, we also port some common used `Babel` plugins to `SWC`.

## Quick start

### Install

Install the plugin by using:

```bash
# npm
npm install @modern-js/builder-plugin-swc -D
# yarn
yarn add @modern-js/builder-plugin-swc -D
# pnpm
pnpm install @modern-js/builder-plugin-swc -D
```

### Register plugin

Register this plugin with `builder`

```js
import { PluginSwc } from '@modern-js/builder-plugin-swc';

builder.addPlugins([PluginSwc()]);
```

That's it !

Now you can use `swc` transformation and minification seeminglessly.

## Config

### `tools.swc`

- type: [swc option](https://swc.rs/docs/configuration/compilation)

You can override default option that plugin provides.
The default option is:

```typescript
{
  cwd: process.cwd(),
  jsc: {
    target: 'es5', // The plugin will set env.targets, so swc will actually ignore this.
    externalHelpers: true,
    parser: {
      tsx: true,
      syntax: 'typescript',
    },
    transform: {
      react: {
        runtime: 'automatic',
      },
    },
    minify: {
      compress: {},
      mangle: true
    }
  },
  sourceMaps: true, // You don't need to specify this manually as plugin will set this by builder's config.
  env: {
    targets: '',
    mode: 'usage',
  },
  test: '',
  exclude: [],
  inlineSourcesContent: true,
}
```

`env.targets` option is no need to specify manually, as plugin will read appropraite `browserslist` in your project.

We recommended to not set `module` yourself, because if you leave this option undefined, we actually can automatic detect correct module type for each file, howevery if you set it yourself, we will use your option for sure, but here comes trouble, if you set it to `esm`, every `cjs` module will be transformed to `esm`, and that may cause some errors. And if you set it to `cjs`, then all code is `cjs`, so you will miss `treeshake` optimization that `Bundler` can provide for you.

`SWC` minification options is the same with `terser`, you can set manually set minify options in `jsc.minify`. Note that you don't need to set `minify: true` to enable minification, we do minification in chunk optimize phase, and will just pass `jsc.minify` as minify option to invoke minify API exposed by `Rust` binding, so `minify: false or true` is ignored and unnecessary.

#### `jsc.minify.compress`

- type: [terser compress option](https://terser.org/docs/api-reference.html#compress-options)
- default: {}

#### `jsc.minify.mangle`

- type: [terser mangle option](https://terser.org/docs/api-reference.html#mangle-options)
- default: true

### `extensions`

- type: `Object`

Some plugins ported from `Babel`

#### `extensions.pluginImport`

- type

```typescript
Array<{
  fromSource: string;
  replaceJs?: {
    ignoreEsComponent?: string[];
    replaceTpl?: string;
    replaceExpr?: (member: string) => (string | false);
    transformToDefaultImport?: boolean;
  };
  replaceCss?: {
    ignoreStyleComponent?: string[];
    replaceTpl?: string;
    replaceExpr?: (member: string) => (string | false);
  };
}>
```

Ported from `@babel/plugin-import`.

`fromSource`

- type: `string`

The package that need to be transformed，eg. in `import {a} from 'foo'`: `foo`

`replaceJs.ignoreEsComponent`

- type: `string[]`
- default: `[]`

The import specifiers which don't need to be transformed.

`replaceJs.replaceTpl`

- type: `string`
- default: `undefineed`

Template that represents repacement, for example:

```javascript
import { MyButton as Btn } from 'foo'
```

If we set `replaceJs.replaceTpl = "foo/es/{{member}}"`, then the code above will be replaced to code below

```javascript
import Btn from 'foo/es/MyButton'
```

We also put some naming conversion functions, take the above example again, if we set it to `"foo/es/{{ kebabCase member }}"`, it will be transformed to code below.

```javascript
import Btn from 'foo/es/my-button'
```

Besides `kebabCase`, there are also `camelCase`, `snakeCase`, `upperCase`, `lowerCase`

`replaceJs.replaceExpr`

- type: `(member: string) => string`
- default: `undefineed`

This is also used to replace import specifiers. The argument is the specifier that imported. eg. `a` in `import { a as b } from 'foo'`.
This funtion is called by `Rust`，and it needs to be synchronous.
We recommend `replaceTpl` instead, because call `js` function through `node-api` will cause performance issue. `node-api` invokes `js` function actually put this `js` call inside a queue, and wait for this call to be executed, so if current `js` thread is busy, then this call will block `Rust` thread for a while.

`transformToDefaultImport`

- type: `boolean`
- default: `true`

Whether transform specifier to default specifier.

#### `extensions.reactUtils`

- type: `Object`

Some little help utils for `React`.

`reactUtils.autoImportReact`

- type: `boolean`

Automatically import `React` as global variable, eg: `import React from 'react'`.
Mostly used for generated `React.createElement`.

`reactUtils.rmEffect`

- type: `boolean`

Remove `useEffect` call.

`reactUtils.rmPropTypes`

- type:

```typescript
{
  mode?: "remove" | "unwrap" | "unsafe-wrap",
  removeImport?: bool,
  ignoreFilenames?: String[],
  additionalLibraries?: String[],
  classNameMatchers?: String[],
}
```

Remove `React` runtime type checking. This is ported from [@babel/plugin-react-transform-remove-prop-types](https://github.com/oliviertassinari/babel-plugin-transform-react-remove-prop-types), All the configurations remain the same.

#### `extensions.lodash`

- type: `{  cwd?: string, ids?: string,}`
- default: `{ cwd: process.cwd(), ids: [] }`

Ported from [@babel/plugin-lodash](https://github.com/lodash/babel-plugin-lodash).

## Limitation

Do not support `@babel/plugin-transform-runtime`.

For `.ts` file, no type checking like `esbuild`.
