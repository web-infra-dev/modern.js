# 图片压缩插件

图片压缩插件会将项目中用到的图片资源进行压缩处理，进而在图片视觉观感不受影响的同时减小产物体积。

## 安装插件

你可以通过如下的命令安装插件:

```bash
# npm
npm install @modern-js/builder-plugin-image-compress -D

# yarn
yarn add @modern-js/builder-plugin-image-compress -D

# pnpm
pnpm install @modern-js/builder-plugin-image-compress -D
```

## 注册插件

你可以在 Builder 中注册插件来启用图片压缩功能:

```js
import { PluginImageCompress } from '@modern-js/builder-plugin-image-compress';

// 往 builder 实例上添加插件
builder.addPlugins([PluginImageCompress()]);
```

## 配置项

插件接受一系列压缩器配置项组成的数组，数组的每一项既可以是字符串也可以是对象。字符串代表使用对应名称的压缩器并启用其默认配置，
或是使用对象格式配置并在 `use` 字段指定压缩器，对象的剩余字段将作为压缩器的配置项。

插件默认会开启 `jpeg`, `png`, `ico` 三种图片压缩器，即等同于如下两种写法的配置：

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

通过指定配置项可以覆盖默认配置，例如让 jpeg 压缩器识别新的拓展名并设置 png 压缩器的质量：

```js
PluginImageCompress([
  { use: 'jpeg', test: /\.(jpg|jpeg|jpe)$/ },
  { use: 'png', minQuality: 50 },
  'ico',
]);
```

默认的 `png` 压缩器为有损压缩，如果需要将其替换为无损压缩器，你可以使用如下配置：

```js
PluginImageCompress(['jpeg', 'pngLossless', 'ico']);
```

配置项列表最终会转换成对应的 bundler loader 配置，因此压缩器也遵循从下到上依次匹配的规则。
例如对于如下配置，`png` 压缩器会优先于 `pngLossless` 压缩器生效：

```js
PluginImageCompress(['jpeg', 'pngLossless', 'ico', 'png']);
```

压缩器的具体配置项请参考 [@napi-rs/image](https://image.napi.rs/docs)。
