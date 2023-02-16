# @modern-js/plugin-module-main-fields

The main fields plugin of Modern.js Module Tools.

You can set [mainFields](https://esbuild.github.io/api/#target) extended module-tools's default behavior by the plugin.

## Usage

```ts
import { defineConfig } from '@modern-js/module-tools';
import { ModuleMainFieldsPlugin } from '@modern-js/plugin-module-main-fields';
export default defineConfig({
  plugins: [
    ModuleMainFieldsPlugin({
      mainFields: ['module', 'main', 'jsnext'],
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
