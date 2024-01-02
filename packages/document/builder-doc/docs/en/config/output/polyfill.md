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

The dynamic delivery feature needs to be used with the upper-level framework. For more details, please refer to [Modern.js - Polyfill At Runtime](https://modernjs.dev/en/guides/advanced-features/compatibility.html#polyfill-at-runtime).

#### off

Polyfill is not injected. When using this option, you need to ensure code compatibility yourself.
