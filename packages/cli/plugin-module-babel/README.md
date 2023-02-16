# @modern-js/plugin-module-babel

The babel plugin of Modern.js Module Tools.

You can add babel compile by the plugin before module-tools internal building.

## Usage

```ts
import { defineConfig } from '@modern-js/module-tools';
import { ModulePluginBabel } from '@modern-js/plugin-module-main-fields';
export default defineConfig({
  plugins: [
    ModulePluginBabel({
      internalPresetOptions: {
        // babel-plugin-import options
        import: {},
        // @babel/preset-react options
        react: {},
      },
      // refer: https://babeljs.io/docs/en/options
      babelTransformOptions: {},
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
