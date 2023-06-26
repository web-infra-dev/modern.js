# Node Polyfill Plugin

:::tip About Node Polyfill
Normally, we don't need to use Node libs on the browser side. However, it is possible to use some Node libs when the code will run on both the Node side and the browser side, and Node Polyfill provides browser versions of polyfills for these Node libs.
:::

By using the Node Polyfill plugin, Node core libs polyfills are automatically injected into the browser-side, allowing you to use these modules on the browser side with confidence.

## Quick Start

### Install

```bash
# npm
npm install @modern-js/plugin-module-node-polyfill -D

# yarn
yarn add @modern-js/plugin-module-node-polyfill -D

# pnpm
pnpm add @modern-js/plugin-module-node-polyfill -D
```

### Register

In Module Tools, you can register plugins in the following way:

```ts
import moduleTools, {  defineConfig } from '@modern-js/module-tools';
import { modulePluginNodePolyfill } from '@modern-js/plugin-module-node-polyfill';

export default defineConfig({
  plugins: [
    moduleTools(),
    modulePluginNodePolyfill(),
  ],
});
```

## Configurations

* **Type**:

```ts
type NodePolyfillOptions = {
  exclude?: string[];
  overrides?: Record<NodePolyfillKey, string>;
}
```

### exclude

Exclude the Node Polyfill to be injected.

``` ts focus=7:9
import moduleTools, {  defineConfig } from '@modern-js/module-tools';
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

Override the built-in Node Polyfill.

``` ts focus=7:9
import moduleTools, {  defineConfig } from '@modern-js/module-tools';
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

When the above global variables are used directly in code, the corresponding polyfill will be injected.

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

When the above module is referenced in code via import / require syntax, the corresponding polyfill will be injected.

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

Currently there is no polyfill for the above modules on the browser side, so when you import the above modules, it will automatically fallback to an empty object.

```ts
import fs from 'fs';

console.log(fs); // -> {}
```
