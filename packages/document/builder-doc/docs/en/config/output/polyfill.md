- **Type:** `'entry' | 'usage' | 'ua' | 'off'`
- **Default:** `'entry'`

Via `output.polyfill` you can configure how the polyfill is injected.

### Config

#### entry

Polyfill is injected in every entry file when `output.polyfill` is configured as `'entry'`.

Equivalent to `useBuiltIns: 'entry'` configuration in `@babel/preset-env`.

#### usage

Polyfill is injected in each file based on the API used in the code.

Equivalent to `useBuiltIns: 'usage'` configuration in `@babel/preset-env`.

#### ua

The Polyfill code is dynamically delivered according to the currently requested UA information.

:::tip
The dynamic delivery feature requires the `@modern-js/plugin-polyfill` plugin.
For more details, please refer to [Polyfill At Runtime](https://modernjs.dev/en/guides/advanced-features/compatibility.html#polyfill-at-runtime).
:::

#### off

Polyfill is not injected. When using this option, you need to ensure code compatibility yourself.

:::tip
When using Rspack as the bundler, the `usage` configuration item is not currently supported.
:::
