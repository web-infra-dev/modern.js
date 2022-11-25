# Node Polyfill Plugin

:::tip About Node Polyfill
Normally, we don't need to use Node libs on the browser side. However, it is possible to use some Node libs when the code will run on both the Node side and the browser side, and Node Polyfill provides browser versions of polyfills for these Node libs.
:::

By using the Node Polyfill plugin, Node core libs polyfills are automatically injected into the browser-side, allowing you to use these modules on the browser side with confidence.

## Install

You can install the plugin with the following command:

```bash
# npm
npm install @modern-js/builder-plugin-node-polyfill -D

# yarn
yarn add @modern-js/builder-plugin-node-polyfill -D

# pnpm
pnpm install @modern-js/builder-plugin-node-polyfill -D
```

## Register

You can register the plugin in Builder to enable node polyfill features:

```js
import { PluginNodePolyfill } from '@modern-js/builder-plugin-node-polyfill';

// Add plugins to the builder instance
builder.addPlugins([PluginNodePolyfill()]);
```

## Node Polyfills

### Globals

- `Buffer`
- `process`

When the above module is used directly in code, the corresponding polyfill will be injected.

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

When the above module is referenced in code via import / require syntax, the corresponding polyfill will be injected.

```ts
import { Buffer } from 'buffer';

const bufferData = Buffer.from('xxxx');
```
