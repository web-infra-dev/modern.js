# @modern-js/plugin-module-banner

The banner plugin of Modern.js Module Tools.

## Usage

```ts modern.config.ts
import { moduleTools, defineConfig } from '@modern-js/module-tools';
import { modulePluginBanner } from '@modern-js/plugin-module-banner';

export default defineConfig({
  plugins: [
    moduleTools(),
    modulePluginBanner({
      banner: {
        js: '//comment',
        css: '/*comment*/',
      },
    }),
  ],
});
```

## Documentation

- [English Documentation](https://modernjs.dev/module-tools/en)
- [中文文档](https://modernjs.dev/module-tools/)

## Contributing

Please read the [Contributing Guide](https://github.com/modern-js-dev/modern.js/blob/main/CONTRIBUTING.md).

## License

Modern.js is [MIT licensed](https://github.com/modern-js-dev/modern.js/blob/main/LICENSE).
