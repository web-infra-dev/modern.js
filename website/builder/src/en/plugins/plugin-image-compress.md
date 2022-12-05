# Image Compress Plugin

With the image compression plugin, image resources used in the project can be compressed to reduce the size of the product without affecting the visual appearance of the image.

## Install

You can install the plugin with the following command:

```bash
# npm
npm install @modern-js/builder-plugin-image-compress -D

# yarn
yarn add @modern-js/builder-plugin-image-compress -D

# pnpm
pnpm install @modern-js/builder-plugin-image-compress -D
```

## Register

You can register the plugin with the Builder to enable image compression:

```js
import { PluginImageCompress } from '@modern-js/builder-plugin-image-compress';

// Add plugins to the builder instance.
builder.addPlugins([PluginImageCompress()]);
```

## Config

The plugin accepts an array of compressor configuration items, each of which can be either a string or an object. The string can be the name of a built-in compressor and its default configuration enabled.
Or use the object format configuration and specify the compressor in the `use` field. The remaining fields of the object will be used as compressor configuration items.

By default, the plugin will enable `jpeg`, `png`, `ico` image compressors, which are equivalent to the following two examples:

```js
PluginImageCompress(['jpeg', 'png', 'ico']);
```

```js
PluginImageCompress([
  { use: 'jpeg' },
  { use: 'png' },
  { use: 'ico' },
]);
```

The default configuration can be overridden by specifying a configuration item.
For example, to allow the jpeg compressor to recognize new extension name and to set the quality of the png compressor.

```js
PluginImageCompress([
  { use: 'jpeg', test: /\.(jpg|jpeg|jpe)$/ },
  { use: 'png', minQuality: 50 },
  'ico',
]);
```

The default `png` compressor is lossy.
If you want to replace it with a lossless compressor, you can use the following configuration.

```js
PluginImageCompress(['jpeg', 'pngLossless', 'ico']);
```

The list of configuration items will eventually be converted to the corresponding bundler loader configuration, so compressors follow the same bottom-to-top matching rule.

For example, the `png` compressor will take precedence over the `pngLossless` compressor for the following configuration:

```js
PluginImageCompress(['jpeg', 'pngLossless', 'ico', 'png']);
```

For more information on compressors, please visit [@napi-rs/image](https://image.napi.rs/docs).
