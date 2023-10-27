# @modern-js/plugin-module-vue

The Vue plugin of Modern.js Module.

The Vue plugin provides support for building Vue 3 components. The plugin internally integrates [esbuild-plugin-vue3](https://github.com/pipe01/esbuild-plugin-vue3) and [@vue/babel-plugin-jsx](https://github.com/vuejs/babel-plugin-jsx).

**Now, it doesn't support that write jsx/tsx in sfc, look forward your contributing!**

## Usage

```ts modern.config.ts
import { moduleTools, defineConfig } from '@modern-js/module-tools';
import { modulePluginVue } from '@modern-js/plugin-module-vue';
export default defineConfig({
  plugins: [
    moduleTools(),
    modulePluginVue(),
  ],
});
```

## Options

### vueJsxPluginOptions

- **Type:**

```ts
type VueJSXPluginOptions = {
  /** transform `on: { click: xx }` to `onClick: xxx` */
  transformOn?: boolean;
  /** enable optimization or not. */
  optimize?: boolean;
  /** merge static and dynamic class / style attributes / onXXX handlers */
  mergeProps?: boolean;
  /** configuring custom elements */
  isCustomElement?: (tag: string) => boolean;
  /** enable object slots syntax */
  enableObjectSlots?: boolean;
  /** Replace the function used when compiling JSX expressions */
  pragma?: string;
};
```

- **Default:** `{}`

Options passed to `@vue/babel-plugin-jsx`, please refer to the [@vue/babel-plugin-jsx documentation](https://github.com/vuejs/babel-plugin-jsx) for detailed usage.

## Documentation

- [English Documentation](https://modernjs.dev/module-tools/en)
- [中文文档](https://modernjs.dev/module-tools/)

## Contributing

Please read the [Contributing Guide](https://github.com/web-infra-dev/modern.js/blob/main/CONTRIBUTING.md).

## License

Modern.js is [MIT licensed](https://github.com/web-infra-dev/modern.js/blob/main/LICENSE).
