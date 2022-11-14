# Esbuild Plugin

:::tip About esbuild
[esbuild](https://esbuild.github.io/) is a front-end build tool based on Golang. It has the functions of bundling, compiling and minimizing JavaScript code. Compared with traditional tools, the performance is significantly improved. When minimizing code, compared to webpack's built-in terser minimizer, esbuild has dozens of times better performance.
:::

Builder provides esbuild plugin that allow you to use esbuild instead of babel-loader, ts-loader and terser for transformation and minification process.

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

You can register the plugin in Builder to enable esbuild features:

```js
import { PluginEsbuild } from '@modern-js/builder-plugin-esbuild';

// Add plugins to the builder instance
builder.addPlugins([PluginEsbuild()]);
```

## Configuration

The plugin will enable code transformation and minification by default. You can also customize the behavior of the plugin through configuration.

### loader

- **Type**:

```ts
type LoaderOptions = EsbuildLoaderOptions | false | undefined;
```

- **Default**:

```ts
const defaultOptions = {
  target: 'es2015',
  charset: builderConfig.output.charset,
};
```

This config is used to enable JavaScript/TypeScript transformation, which will replace babel-loader and ts-loader with esbuild-loader.

If you want to modify the options, you can check the [esbuild-loader documentation](https://github.com/privatenumber/esbuild-loader#loader).

### minimize

- **Type**:

```ts
type MinimizeOptions = EsbuildMinifyOptions | false | undefined;
```

- **Default**:

```ts
const defaultOptions = {
  css: true,
  target: 'es2015',
};
```

This option is used to enable code minification for JavaScript and CSS.

If you want to modify the options, you can check the [esbuild-loader documentation](https://github.com/privatenumber/esbuild-loader#minifyplugin).

## Limitations

Although esbuild can significantly improve the build performance of existing webpack projects, it still has certain limitations that require special attention.

### Compatibility

As a compiler (i.e. `loader` capability), esbuild can only support ES2015 (ie ES6) syntax. If the production environment needs to downgrade to ES5 and below syntax, **please close esbuild** in the production environment.

As a code minify tool (i.e. `minimize` capability), esbuild can minify the code in production environment, but only supports ES2015 or above syntax (because the compression process needs to recognize the code AST and perform syntax conversion). You can specify the target syntax version by following config:

```js
builder.addPlugins([
  PluginEsbuild({
    minimize: {
      target: 'es2015',
    },
  }),
]);
```

:::danger Caution
Projects that need to be compatible with ES5 and below syntax in the production environment need to be careful to turn on the minimize config.
:::

### Not support Babel plugins

As a compiler, since the bottom layer of the plugin uses esbuild's `Transform API`, it does not support esbuild plugins to customize the compilation process. Therefore, the syntax transformation function of the original Babel plugins such as `babel-plugin-import` is not available after esbuild is turned on.

### Bundle Size

Although the compression speed of esbuild is faster, the compression ratio of esbuild is lower than that of terser, so the bundle size will increase, please use it according to the scenes. Generally speaking, esbuild is more suitable for scenes that are not sensitive to bundle size.

You can refer to [minification-benchmarks](https://github.com/privatenumber/minification-benchmarks) for a detailed comparison between minimizers.
