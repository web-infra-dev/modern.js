---
sidebar_position: 0
---

# Configure to use

There are two configurations in the Modern.js, a compile configuration and a server runtime configuration.

The compile configuration can be configured in two places:

- `package.json` file
- `modern.config.t(j)s` file in the root path

:::warning Warning
Configurations in both `package.json` and `modern.config.t(j)s` file are not supported for the same configuration. Configuration in `modern.config. t(j)s` is recommended.
:::

Server runtime configuration can be configured in the `modern.server-runtime.config.t(j)s` file in the root path.

## Configure in the configuration file

Modern.js configuration files are defined in the root path of the project, and both `.js` and `.ts` formats are supported:

- `modern.config.js`
- `modern.config.ts`

### modern.config.js

You can use JavaScript syntax in the `modern.config.js` file and it is more flexible than in the `package.json` file.

For example, you can define configuration options for function types in `modern.config.js`:

```js title="modern.config.js"
export default {
  source: {
    alias: opts => {
      opts['@common'] = './src/common';
    },
  },
};
```

You can also dynamically set it with `process.env.NODE _ENV`:

```js title="modern.config.js"
export default {
  server: {
    ssr: process.env.NODE_ENV === 'development',
  },
};
```

### modern.config.ts

We recommend using configuration files in `.ts` format, which provides friendly TypeScript type hints to help you avoid configuration errors.

Import the `defineConfig` tool function from `@modern-js/app-tools`, which will help you with configuration type derivation and type completion:

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  source: {
    alias: {
      '@common': './src/common',
    },
  },
});
```

## Configure in package.json (not recommended)

In addition to configuration files, configuration options can also be set the `modernConfig` field in the `package.json`, such as:

```json title="package.json"
{
  "modernConfig": {
    "source": {
      "alias": {
        "@common": "./src/common"
      }
    }
  }
}
```

Due to the limitation of the JSON file format, only simple types such as numbers, strings, boolean values, arrays, etc. can be defined in `package.json`. When we need to set the value of the function type, it is recommended to set it in the Modern.js configuration file.

## Note

- It is not recommended to use both `package.json` and `modern.config.t[j]s` for configuration. If both are used and a configuration conflict occurs, Modern.js will prompt error on the command line.
- `@modern-js/runtime` exports the [defineConfig](/docs/apis/app/runtime/app/define-config) API of the same name, please pay attention to the distinction.
