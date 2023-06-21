# @modern-js/plugin-module-polyfill

The polyfill plugin of Modern.js Module Tools.

A Library author don't want to "pollute" the global scope with the polyfills you are loading. This plugin injects imports to polyfills for unsupported features which are used in your code, without attaching the polyfills to the global scope but importing them as normal functions.

**Note: It will not transform syntax by targets**

## Usage

```ts
import { moduleTools, defineConfig } from '@modern-js/module-tools';
import { modulePluginPolyfill } from '@modern-js/plugin-module-polyfill';

export default defineConfig({
  plugins: [
    moduleTools(),
    modulePluginPolyfill({
      targets: {
        ios: '9';
      }
    })
  ],
});
```

## Documentation

- [English Documentation](https://modernjs.dev/module-tools/en)
- [中文文档](https://modernjs.dev/module-tools/)

## Contributing

Please read the [Contributing Guide](https://github.com/web-infra-dev/modern.js/blob/main/CONTRIBUTING.md).

## License

Modern.js is [MIT licensed](https://github.com/web-infra-dev/modern.js/blob/main/LICENSE).
