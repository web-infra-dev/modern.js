# @modern-js/plugin-module-import

The polyfill plugin of Modern.js Module Tools.

A Library author don't want to "pollute" the global scope with the polyfills you are loading. This plugin injects imports to polyfills for unsupported features which are used in your code, without attaching the polyfills to the global scope but importing them as normal functions.

**Note: It will not transform syntax by targets**

## Usage

```ts modern.config.ts
import { defineConfig } from '@modern-js/module-tools';
import { modulePluginImport } from '@modern-js/plugin-module-import';

export default defineConfig({
  plugins: [modulePluginImport({
    pluginImport: [
      {
          libraryName: 'antd',
          style: 'css',
      },
    ],
  })],
});
```

## Documentation

- [English Documentation](https://modernjs.dev/module-tools/en)
- [中文文档](https://modernjs.dev/module-tools/)

## Contributing

Please read the [Contributing Guide](https://github.com/modern-js-dev/modern.js/blob/main/CONTRIBUTING.md).

## License

Modern.js is [MIT licensed](https://github.com/modern-js-dev/modern.js/blob/main/LICENSE).
