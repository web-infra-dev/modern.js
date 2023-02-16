# @modern-js/plugin-module-target

The target plugin of Modern.js Module Tools.

You can set [target](https://esbuild.github.io/api/#target) instead of module-tools's [`target`](https://edenx.bytedance.net/module-tools/en/api/config/build-config.html#target) api by the plugin.

**Note: It may not work correctly**

## Usage

```ts
import { defineConfig } from '@modern-js/module-tools';
import { ModuleTargetPlugin } from '@modern-js/plugin-module-target';
export default defineConfig({
  plugins: [
    ModuleTargetPlugin({
      target: [
        'es2020',
        'chrome58',
        'edge16',
        'firefox57',
        'node12',
        'safari11',
      ],
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
