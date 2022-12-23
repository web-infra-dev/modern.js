# Quick Start

## Environment preparation

Before using Modern.js Builder, you need to install [Node.js](https://nodejs.org/), and ensure that the Node.js version is greater than 14.17.6. We recommend using the LTS version of Node.js 16.

You can check the currently used Node.js version with the following command:

```bash
node -v
#v14.20.0
```

If you have not installed Node.js in your current environment, or the installed version is lower than 14.17.6, you can use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to install the required version.

Here is an example of installing Node.js 16 LTS version via nvm:

```bash
# Install the long-term support version of Node.js 16
nvm install 16 --lts

# Set the newly installed Node.js 16 as the default version
nvm alias default 16

# Switch to the newly installed Node.js 16
nvm use 16
```

:::tip nvm and fnm
Both nvm and fnm are Node.js version management tools. Relatively speaking, nvm is more mature and stable, while fnm is implemented using Rust, which provides better performance than nvm.
:::

## Using Modern.js Framework

**Modern.js Framework use Modern.js Builder as the build engine by default**. If you are a business developer, you do not need to manually install Builder, just create a Modern.js project and use all the features provided by Builder.

Please check the [Modern.js framework documentation](https://modernjs.dev/) to learn how to use Modern.js framework.

:::tip About the documentation
Modern.js framework documentation and Modern.js Builder documentation are deployed under two separate sites. If you encounter any build-related problems while using the Modern.js framework, you can always refer to the documentation of Modern.js Builder to find solutions.
:::

## Use Builder in a front-end framework

If you are developing a front-end framework, you can use Builder by following these steps:

### 1. Install Builder

You need to install two packages:

- `@modern-js/builder` is the core package of Builder and exports the core API.
- `@modern-js/builder-webpack-provider` is a provider for Builder, providing webpack-based building abilities.

```bash
pnpm add @modern-js/builder@beta @modern-js/builder-webpack-provider@beta -D
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
