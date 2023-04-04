# @modern-js/plugin-module-node-polyfill

The node polyfill plugin of Modern.js Module Tools.

## Usage

```js
import moduleTools, { defineConfig } from '@modern-js/module-tools';
import { modulePluginNodePolyfill } from '@modern-js/plugin-module-node-polyfill';

export default defineConfig({
  plugins: [
    moduleTools(),
    modulePluginNodePolyfill(),
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
