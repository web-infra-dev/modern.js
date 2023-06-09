# @modern-js/plugin-module-babel

The Babel plugin of Modern.js Module Tools.

You can add Babel compile by the plugin before module-tools internal building.

## Usage

```ts modern.config.ts
import moduleTools, { defineConfig } from '@modern-js/module-tools';
import { modulePluginBabel } from '@modern-js/plugin-module-babel';
export default defineConfig({
  plugins: [
    moduleTools(),
    modulePluginBabel({
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

Please read the [Contributing Guide](https://github.com/web-infra-dev/modern.js/blob/main/CONTRIBUTING.md).

## License

Modern.js is [MIT licensed](https://github.com/web-infra-dev/modern.js/blob/main/LICENSE).
