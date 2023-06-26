# Node Polyfill 插件

:::tip Node Polyfill 介绍
通常情况下，我们不会在浏览器端使用 Node 模块。但在当前代码需要同时在 Node 端和浏览器端运行时，用到一些 Node 模块是有可能的。Node Polyfill 为这些 Node 模块提供了浏览器版本的 polyfills。
:::

通过使用 Node Polyfill 插件，会自动注入 Node 核心模块在浏览器端的 polyfills，让你可以在浏览器端放心使用这些模块。

## 快速开始

### 安装

```bash
# npm
npm install @modern-js/plugin-module-node-polyfill -D

# yarn
yarn add @modern-js/plugin-module-node-polyfill -D

# pnpm
pnpm add @modern-js/plugin-module-node-polyfill -D
```

### 注册插件

在 Module Tools 中，你可以按照如下方式注册插件：

```ts
import { moduleTools, defineConfig } from '@modern-js/module-tools';
import { modulePluginNodePolyfill } from '@modern-js/plugin-module-node-polyfill';

export default defineConfig({
  plugins: [
    moduleTools(),
    modulePluginNodePolyfill(),
  ],
});
```

## 配置

* **类型：**

```ts
type NodePolyfillOptions = {
  exclude?: string[];
  overrides?: Record<NodePolyfillKey, string>;
}
```

### exclude

排除要注入的 Node Polyfill。

``` ts focus=7:9
import { moduleTools, defineConfig } from '@modern-js/module-tools';
import { modulePluginNodePolyfill } from '@modern-js/plugin-module-node-polyfill';

export default defineConfig({
  plugins: [
    moduleTools(),
    modulePluginNodePolyfill({
      exclude: ['console'],
    }),
  ],
});
```

### overrides

覆盖内置的 Node Polyfill。

``` ts focus=7:9
import { moduleTools, defineConfig } from '@modern-js/module-tools';
import { modulePluginNodePolyfill } from '@modern-js/plugin-module-node-polyfill';

export default defineConfig({
  plugins: [
    moduleTools(),
    modulePluginNodePolyfill({
      overrides: {
        fs: path.join(__dirname, './custom-fs.js'),
      }
    }),
  ],
});
```

## Node Polyfills

### Globals

* `Buffer`
* `process`
* `console`

当你在代码中使用以上全局变量时，对应 polyfill 会被自动注入。

```ts
const bufferData = Buffer.from('xxxx');
```

### Modules

* `assert`
* `buffer`
* `console`
* `constants`
* `crypto`
* `domain`
* `events`
* `http`
* `https`
* `os`
* `path`
* `punycode`
* `process`
* `querystring`
* `stream`
* `_stream_duplex`
* `_stream_passthrough`
* `_stream_readable`
* `_stream_transform`
* `_stream_writable`
* `string_decoder`
* `sys`
* `timers`
* `tty`
* `url`
* `util`
* `vm`
* `zlib`

当你通过 `require` 或 `import` 等语法在代码中引用以上模块时，对应 polyfill 会被注入。

```ts
import { Buffer } from 'buffer';

const bufferData = Buffer.from('xxxx');
```

### Fallbacks

* `child_process`
* `cluster`
* `dgram`
* `dns`
* `fs`
* `module`
* `net`
* `readline`
* `repl`
* `tls`

目前浏览器端没有以上模块的 polyfill，因此当你引用以上模块时，会自动 fallback 为一个空对象。

```ts
import fs from 'fs';

console.log(fs); // -> {}
```
