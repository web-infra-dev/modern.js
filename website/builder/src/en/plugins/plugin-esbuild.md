# Esbuild Plugin

> ESBuild is a front-end build tool based on Golang. It has the functions of bundling, compiling and minifing JavaScript code. Compared with traditional tools, the performance is improved by 10~100 times.

Builder provides ESBuild plugin that allow you to use ESBuild instead of babel-loader, ts-loader and terser for transformation and minification process.

## Install

You can install the plugin with the following command:

```bash
# npm
npm install @modern-js/builder-plugin-esbuild -D
# yarn
yarn add @modern-js/builder-plugin-esbuild -D
# pnpm
pnpm install @modern-js/builder-plugin-esbuild -D
```

## Register

You can register the plugin  in Builder:

```js
import { Builder } from '@modern-js/builder-plugin-esbuild';

// Add plugins to the builder instance
builder.addPlugins([PluginEsbuild()]);
```

## Configuration

The default config of the plugin is as follows:

```js
{
  loader: {},
  minimize: {},
}
```

The functions of JS(X)/TS(X) transformation and code minification are automatically enabled. Of course, you can also customize the behavior of the plugin through following config.

### loader

- **Type**: `undefined | false | ` { javascript?: boolean | [LoaderOptions](https://github.com/privatenumber/esbuild-loader#loader); typescript?: boolean | [LoaderOptions](https://github.com/privatenumber/esbuild-loader#loader); }
- **Default**: `{}`

This config is used to enable JavaScript/TypeScript transformation, which will replace babel-loader and ts-loader with esbuild-loader. The transformation of JavaScript(JSX) and TypeScript(TSX) can be controlled separately.

### minimize

- **Type**: `undefined | false | ` [MinifyPlugin.Options](https://github.com/privatenumber/esbuild-loader#minifyplugin)
- **Default**: `true`

When set to `true`, the default config will be applied, which is:

```typescript
const DEFAULT_MINIFY_OPTIONS = {
  target: 'es2015',
};
```

If you need to modify the minify parameters, you can check the [official documentation](https://github.com/privatenumber/esbuildloader#minifyplugin).

## Limitations

Although ESBuild can significantly improve the build performance of existing webpack projects, it still has certain limitations that require special attention.

As a compiler(i.e. `loader` capability), ESBuild can only support ES2015 (ie ES6) syntax. If the production environment needs to downgrade to ES5 and below syntax, **please close ESBuild** in the production environment. In addition, since the bottom layer of the plugin uses ESBuild's `Transform API`, it does not support ESBuild plugins to customize the compilation process. Therefore, the syntax transformation function of the original Babel plugins such as `babel-plugin-import` is not available after ESBuild is turned on.

As a code minify tool (i.e. `minimize` capability), ESBuild can minify the code in production environment, but only supports ES2015 or above syntax (because the compression process needs to recognize the code AST and perform syntax conversion). You can specify the target syntax version by following config:

```js
builder.addPlugins([PluginEsbuild({
  minimize: {
    target: 'es2015',
  },
})]);
```

:::danger Caution
Projects that need to be compatible with ES5 and below syntax in the production environment need to be careful to turn on the minimize config!
:::
