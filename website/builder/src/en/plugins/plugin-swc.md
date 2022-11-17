# SWC plugin

[SWC](https://SWC.rs/) (Speedy Web Compiler) is a transformer and minizer for `JavaScript` and `TypeScript` based on `Rust`. `SWC` can provide the same abilities with `Babel`, and it's more than 10x faster than `Babel`.

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

Now you can use `SWC` transformation and minification seeminglessly.

## Config

### `tools.swc`

- Type: `PluginConfig`

```typescript
export interface PluginConfig {
  presetReact?: ReactConfig;
  presetEnv?: EnvConfig;

  minify?: boolean | JsMinifyOptions;

  extensions?: Extensions;

  includes?: (RegExp | string)[];
  excludes?: (RegExp | string)[];
}
```

### `presetReact`

- Type: [`presetReact` in `SWC`](https://swc.rs/docs/configuration/compilation#jsctransformreact).

Ported from `@babel/preset-react`. The value you passed will be merged with default option.
Default option is:

```typescript
{
  runtime: 'automatic',
}
```

### `presetEnv`

- Type: [`presetEnv` in `SWC`](https://swc.rs/docs/configuration/supported-browsers#options).

Ported from `@babel/preset-env`. The value you passed will be merged with default option.
Default option is:

```typescript
{
  targets: '', // automatic get browserslist from your project, so you don't have to set this field
  mode: 'usage',
}
```

### `includes` and `excludes`

- Type: `Array<string | RegExp>`

You can specify which file needs to be transpiled, and which doesn't

### `minify`

- Type: `boolean` or [compress configuration](https://terser.org/docs/api-reference.html#compress-options).

Default option is: `{ compress: {}, mangle: true }`.

If set it to `false`, then `SWC` minification will be disabled, if set it to `true` then will it applies default option. If you pass an object, then this object will be merged with default option.

### `extensions`

- Type: `Object`

Some plugins ported from `Babel`.

#### `extensions.pluginImport`

- type

```typescript
Array<{
  fromSource: string;
  replaceJs?: {
    ignoreEsComponent?: string[];
    replaceTpl?: string;
    replaceExpr?: (member: string) => string | false;
    transformToDefaultImport?: boolean;
  };
  replaceCss?: {
    ignoreStyleComponent?: string[];
    replaceTpl?: string;
    replaceExpr?: (member: string) => string | false;
  };
}>;
```

Ported from `@babel/plugin-import`.

`fromSource`

- Type: `string`

The package that need to be transformed，eg. in `import {a} from 'foo'`, `fromSource` should be `foo`.

`replaceJs.ignoreEsComponent`

- Type: `string[]`
- default: `[]`

The import specifiers which don't need to be transformed.

`replaceJs.replaceTpl`

- Type: `string`
- default: `undefineed`

Template that represents repacement, for example:

```javascript
import { MyButton as Btn } from 'foo';
```

If we set `replaceJs.replaceTpl = "foo/es/{{member}}"`, then the code above will be replaced to code below:

```javascript
import Btn from 'foo/es/MyButton';
```

We also put some naming conversion functions, take the above example again, if we set it to `"foo/es/{{ kebabCase member }}"`, it will be transformed to code below:

```javascript
import Btn from 'foo/es/my-button';
```

Besides `kebabCase`, there are also `camelCase`, `snakeCase`, `upperCase`, `lowerCase`

`replaceJs.replaceExpr`

- Type: `(member: string) => string`
- default: `undefineed`

This is also used to replace import specifiers. The argument is the specifier that imported. eg. `a` in `import { a as b } from 'foo'`.
This funtion is called by `Rust`，and it needs to be synchronous.
We recommend `replaceTpl` instead, because call `js` function through `node-api` will cause performance issue. `node-api` invokes `js` function actually put this `js` call inside a queue, and wait for this call to be executed, so if current `js` thread is busy, then this call will block `Rust` thread for a while.

`transformToDefaultImport`

- Type: `boolean`
- default: `true`

Whether transform specifier to default specifier.

#### `extensions.reactUtils`

- Type: `Object`

Some little help utils for `React`.

`reactUtils.autoImportReact`

- Type: `boolean`

Automatically import `React` as global variable, eg: `import React from 'react'`.
Mostly used for generated `React.createElement`.

`reactUtils.rmEffect`

- Type: `boolean`

Remove `useEffect` call.

`reactUtils.rmPropTypes`

- Type:

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

- Type: `{ cwd?: string, ids?: string,}`
- default: `{ cwd: process.cwd(), ids: [] }`

Ported from [@babel/plugin-lodash](https://github.com/lodash/babel-plugin-lodash).

## Limitation

Do not support `@babel/plugin-transform-runtime` and other custom `Babel` plugins.
