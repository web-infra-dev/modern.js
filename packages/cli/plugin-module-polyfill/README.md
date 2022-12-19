# @modern-js/plugin-module-polyfill

@modern-js/module-tools\`s plugin.

A Library author don't want to "pollute" the global scope with the polyfills you are loading. This plugin injects imports to polyfills for unsupported features which are used in your code, without attaching the polyfills to the global scope but importing them as normal functions.

**Note: It will not transform syntax by targets**


## Usage

``` ts
import { defineConfig } from '@modern-js/module-tools';
import { ModulePolyfillPlugin } from '@modern-js/plugin-module-polyfill';
export default defineConfig({
  plugins: [ModulePolyfillPlugin({
    targets: {
      ios: '9';
    }
  })],
});
```


## Contributing

- [Contributing Guide](https://github.com/modern-js-dev/modern.js/blob/main/CONTRIBUTING.md)
