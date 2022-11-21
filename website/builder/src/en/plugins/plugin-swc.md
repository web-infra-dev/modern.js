# SWC plugin

[SWC](https://SWC.rs/) (Speedy Web Compiler) is a transformer and minimizer for JavaScript and TypeScript based on `Rust`. SWC can provide the same abilities with Babel, and it's more than 10x faster than Babel.

Modern.js Builder has a out-of-box plugin for SWC, power your Web application with Polyfill and minification, we also port some common used Babel plugins to SWC.

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

Register this plugin with Builder:

```js
import { PluginSwc } from '@modern-js/builder-plugin-swc';

builder.addPlugins([PluginSwc()]);
```

That's it !

Now you can use SWC transformation and minification in your project.

## Config

- Type: `PluginConfig`

```ts
type PluginConfig = {
  presetReact?: ReactConfig;
  presetEnv?: EnvConfig;
  jsMinify?: boolean | JsMinifyOptions;
  extensions?: Extensions;
};
```

### presetReact

- Type: [presetReact](https://swc.rs/docs/configuration/compilation#jsctransformreact) in SWC.

Ported from `@babel/preset-react`. The value you passed will be merged with default option.

Default option is:

```ts
{
  runtime: 'automatic',
}
```

### presetEnv

- Type: [presetEnv](https://swc.rs/docs/configuration/supported-browsers#options) in SWC.

Ported from `@babel/preset-env`. The value you passed will be merged with default option.

Default option is:

```ts
{
  targets: '', // automatic get browserslist from your project, so you don't have to set this field
  mode: 'usage',
}
```

### jsMinify

- Type: `boolean` or [compress configuration](https://terser.org/docs/api-reference.html#compress-options).

Default option is: `{ compress: {}, mangle: true }`.

If set it to `false`, then SWC minification will be disabled, if set it to `true` then will it applies default option. If you pass an object, then this object will be merged with default option.

### extensions

- Type: `Object`

Some plugins ported from Babel.

#### extensions.pluginImport

- type

```ts
type PluginImportOptions = Array<{
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

Ported from [babel-plugin-import](https://github.com/umijs/babel-plugin-import).

**fromSource**

- Type: `string`

The package that need to be transformed，eg. in `import { a } from 'foo'`, `fromSource` should be `foo`.

**replaceJs.ignoreEsComponent**

- Type: `string[]`
- Default: `[]`

The import specifiers which don't need to be transformed.

**replaceJs.replaceTpl**

- Type: `string`
- Default: `undefined`

Template that represents replacement, for example:

```ts
import { MyButton as Btn } from 'foo';
```

If we set:

```ts
PluginSWC({
  extensions: {
    pluginImport: [
      {
        replaceJs: {
          replaceTpl: 'foo/es/{{member}}',
        },
      },
    ],
  },
});
```

Then the code above will be replaced to code below:

```ts
import Btn from 'foo/es/MyButton';
```

We also put some naming conversion functions, take the above example again, if we set it to:

```ts
PluginSWC({
  extensions: {
    pluginImport: [
      {
        replaceJs: {
          replaceTpl: 'foo/es/{{ kebabCase member }}',
        },
      },
    ],
  },
});
```

It will be transformed to code below:

```ts
import Btn from 'foo/es/my-button';
```

Besides `kebabCase`, there are also `camelCase`, `snakeCase`, `upperCase`, `lowerCase`.

**replaceJs.replaceExpr**

- Type: `(member: string) => string`
- Default: `undefined`

This is also used to replace import specifiers. The argument is the specifier that imported. eg. `a` in `import { a as b } from 'foo'`.
This function is called by `Rust`，and it needs to be synchronous.
We recommend `replaceTpl` instead, because call `js` function through `node-api` will cause performance issue. `node-api` invokes `js` function actually put this `js` call inside a queue, and wait for this call to be executed, so if current `js` thread is busy, then this call will block `Rust` thread for a while.

**transformToDefaultImport**

- Type: `boolean`
- Default: `true`

Whether transform specifier to default specifier.

#### extensions.reactUtils

- Type: `Object`

```ts
type ReactUtilsOptions = {
  autoImportReact?: boolean;
  removeEffect?: boolean;
  removePropTypes?: {
    mode?: 'remove' | 'unwrap' | 'unsafe-wrap';
    removeImport?: boolean;
    ignoreFilenames?: string[];
    additionalLibraries?: string[];
    classNameMatchers?: string[];
  };
};
```

Some little help utils for `React`.

**reactUtils.autoImportReact**

- Type: `boolean`

Automatically import `React` as global variable, eg: `import React from 'react'`.
Mostly used for generated `React.createElement`.

**reactUtils.removeEffect**

- Type: `boolean`

Remove `useEffect` call.

**reactUtils.removePropTypes**

- Type:

```ts
type RemovePropTypesOptions = {
  mode?: 'remove' | 'unwrap' | 'unsafe-wrap';
  removeImport?: boolean;
  ignoreFilenames?: string[];
  additionalLibraries?: string[];
  classNameMatchers?: string[];
};
```

Remove `React` runtime type checking. This is ported from [@babel/plugin-react-transform-remove-prop-types](https://github.com/oliviertassinari/babel-plugin-transform-react-remove-prop-types), All the configurations remain the same.

#### extensions.lodash

- Type: `{ cwd?: string; ids?: string;}`
- Default: `{ cwd: process.cwd(), ids: [] }`

Ported from [@babel/plugin-lodash](https://github.com/lodash/babel-plugin-lodash).

## Limitation

Do not support `@babel/plugin-transform-runtime` and other custom Babel plugins.
