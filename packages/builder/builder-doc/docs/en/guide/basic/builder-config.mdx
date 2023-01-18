# Builder Config

Builder provides a wealth of configs to help users customize the build behavior.

## Config Categories

Builder Configs are divided into the following categories:

- [Dev Config](/api/config-dev.html): Config related to local development.
- [Html Config](/api/config-html.html): Config related to HTML.
- [Tools Config](/api/config-tools.html): Config related to the low-level tools.
- [Source Config](/api/config-source.html): Config related to source code parsing and compilation.
- [Output Config](/api/config-output.html): Config related to output.
- [Security Config](/api/config-security.html): Config related to security.
- [Performance Config](/api/config-performance.html): Config related to performance.

You can find detailed descriptions of all configs on the [API Reference](/en/api/) page.

## Default Values

The Builder presets a default value for each config, and the default value is suitable for most scenarios. At the same time, the upper-level framework will also override some of the default values based on the requirements of the vertical scene.

In most cases, you don't need to define any Builder config, just use it right out of the box.

## Use Config

### In the Upper Framework

When you use a Builder-based upper-level framework, you can define the Builder config directly through the framework's config file, and the upper-level framework will pass the config to the Builder.

For example, in the {MODERN_JS} framework, you can define the Builder's [source.alias](/en/api/config-source.html#source-alias) config in [modern.config.ts](https://modernjs.dev/docs/apis/app/config/usage) file.

```ts
// modern.config.ts
export default {
  source: {
    alias: {
      '@common': './src/common',
    },
  },
};
```

Commonly used framework config files include:

| Framework | Config File        |
| --------- | ------------------ |
| Modern.js | `modern.config.ts` |
| EdenX     | `edenx.config.ts`  |
| PIA       | `pia.config.ts`    |

### Using the Node API

When you call the Builder through the Node API, you can pass in the Builder config through the Provider's `builderConfig` option:

```ts
import { builderWebpackProvider } from '@modern-js/builder-webpack-provider';

const provider = builderWebpackProvider({
  builderConfig: {
    // some configs
  },
});
```

Please refer to [API - createBuilder](/en/api/builder-core.html#createbuilder) for details.

## Relationship with Framework Config

Generally speaking, the Builder config is a subset of the framework config.

**Builder config only deals with build-related behaviors**, while framework config covers a wider range, including runtime, server, deployment, etc., so framework config is extended from Builder config.

## Debug the config

You can enable Builder's debug mode by adding the `DEBUG=builder` environment variable when executing a build.

```bash
DEBUG=builder pnpm dev
```

In debug mode, Builder will write the Builder config to the dist directory, which is convenient for developers to view and debug.

```
Inspect config succeed, open the following files to view the content:

   - Builder Config: /Project/demo/dist/builder.config.js
   - Webpack Config (web): /Project/demo/dist/webpack.config.web.js
```

Open the generated `/dist/builder.config.js` file to see the complete content of the Builder config.

For a complete introduction to debug mode, see the [Debug Mode](/guide/debug/debug-mode.html) chapter.
