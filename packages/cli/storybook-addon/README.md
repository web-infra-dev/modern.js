# @modern-js/storybook-addon

Use a Modern.js v3 application's shared and `client` build configuration in a Storybook Rsbuild preview. The addon uses the project's `@modern-js/app-tools` configuration resolver. Storybook owns the preview entry, output directory and hot-update client.

Register `@modern-js/storybook-addon` in the `addons` array of `.storybook/main.ts` and set `framework` to `storybook-react-rsbuild`. The addon discovers `modern.config.*` in the application directory. To select a custom file, use `{ name: '@modern-js/storybook-addon', options: { configPath: './config/modern.config.ts' } }`.

See the [Modern.js Storybook guide](https://modernjs.dev/guides/basic-features/debug/using-storybook) and the [Storybook Rsbuild example](https://github.com/rstackjs/storybook-rsbuild/tree/main/sandboxes/modernjs-react).
