# Quick Start

## Using Modern.js App

**Modern.js 2.0 use Modern.js Builder as the build engine by default**.

If you are a business developer, you do not need to manually install Builder, you can just create a Modern.js 2.0 project and use all the features provided by Builder.

> Tips: Modern.js 2.0 is still under development and not officially released yet.

## Use Builder in a front-end framework

If you are developing a front-end framework, you can use Builder by following these steps:

### 1. Install Builder

You need to install two packages:

- `@modern-js/builder` is the core package of Builder and exports the core API.
- `@modern-js/builder-webpack-provider` is a provider for Builder, providing webpack-based building abilities.

```bash
pnpm add @modern-js/builder @modern-js/builder-webpack-provider -D
```

> When upgrading the version, please make sure that Builder and Provider you installed have the same version.

### 2. Create Builder Instance

There are two steps to creating a Builder instance:

First you need to initialize the Builder Provider and pass in the `builderConfig` config object. Builder provides a lot of configs that allow you to customize the build behavior. At this point, you don't need to know the specific content of the config, just pass in an empty object. You can find all available configs in [API - config](/en/api/#config).

```ts
import { createBuilder } from '@modern-js/builder';
import { builderWebpackProvider } from '@modern-js/builder-webpack-provider';

const provider = builderWebpackProvider({
  builderConfig: {
    // some configs
  },
});
```

After getting the provider object, you can call the `createBuilder` method to create a Builder instance object:

```ts
const builder = await createBuilder(provider, {
  entry: {
    index: './src/index.ts',
  },
});
```

Except the `entry` option, the `createBuilder` method also provides some other options, which you can learn more about in [API - createBuilder](/en/api/builder-core.html#createbuilder).

### 3. Call Builder Instance Method

The Builder instance provides some methods, which you can use it according to the usage scenarios.

To start local development, it is recommended to use the [builder.startDevServer](/en/api/builder-instance.html#builder-startdevserver) method, which will start a local Dev Server.

```ts
await builder.startDevServer();
```

After successfully starting Dev Server, you can see the following logs:

```bash
info    Starting dev server...
info    Dev server running at:

  > Local:    http://localhost:8081
  > Network:  http://192.168.0.1:8081
```

To deploy the App to production environment, it is recommended to use the [builder.build](/en/api/builder-instance.html#builder-build) method, which will build the production outputs.

```ts
await builder.build();
```

> For more introduction of Builder instance methods, please read the [Builder Instance](/en/api/builder-instance.html) chapter.

After completing the above three steps, you have learned the basic usage of Builder. Next, you can customize the build process through the Builder plugin and Builder configs.

## Next Step

You may want:

<NextSteps>
  <Step href="/guide/glossary.html" title="Glossary" description="Learn about Builder related concepts"/>
  <Step href="/guide/features.html" title="All Features" description="Learn all features of Builder"/>
  <Step href="/api" title="API Reference" description="View detailed API documentation"/>
</NextSteps>
