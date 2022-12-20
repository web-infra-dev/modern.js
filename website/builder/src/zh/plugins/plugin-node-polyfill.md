# Node Polyfill 插件

:::tip Node Polyfill 介绍
通常情况下，我们不会在浏览器端使用 Node 模块。但在当前代码需要同时在 Node 端和浏览器端运行时，用到一些 Node 模块是有可能的。Node Polyfill 为这些 Node 模块提供了浏览器版本的 polyfills。
:::

通过使用 Node Polyfill 插件，会自动注入 Node 核心模块在浏览器端的 polyfills，让你可以在浏览器端放心使用这些模块。

## 快速开始

### 安装插件

你可以通过如下的命令安装插件:

```bash
# npm
npm install @modern-js/builder-plugin-node-polyfill -D

# yarn
yarn add @modern-js/builder-plugin-node-polyfill -D

# pnpm
pnpm install @modern-js/builder-plugin-node-polyfill -D
```

### 注册插件

在 Modern.js / EdenX 等上层框架中，你可以通过 `builderPlugins` 配置项来注册 node polyfill 插件：

```ts
import { PluginNodePolyfill } from '@modern-js/builder-plugin-node-polyfill';

export default {
  builderPlugins: [PluginNodePolyfill()],
};
```

当你直接调用 Builder 的 Node API 时，可以通过 `addPlugins` 方法来注册 node polyfill 插件：

```js
import { PluginNodePolyfill } from '@modern-js/builder-plugin-node-polyfill';

// 往 builder 实例上添加插件
builder.addPlugins([PluginNodePolyfill()]);
```

## Node Polyfills

### Globals

- `Buffer`
- `process`

当直接在代码中使用以上模块时，对应 polyfill 会被注入。

```ts
const bufferData = Buffer.from('xxxx');
```

### Modules

- `assert`
- `buffer`
- `console`
- `constants`
- `crypto`
- `domain`
- `events`
- `http`
- `https`
- `os`
- `path`
- `punycode`
- `process`
- `querystring`
- `stream`
- `_stream_duplex`
- `_stream_passthrough`
- `_stream_readable`
- `_stream_transform`
- `_stream_writable`
- `string_decoder`
- `sys`
- `timers`
- `tty`
- `url`
- `util`
- `vm`
- `zlib`

当通过 import / require 等语法在代码中引用以上模块时，对应 polyfill 会被注入。

```ts
import { Buffer } from 'buffer';

const bufferData = Buffer.from('xxxx');
```
