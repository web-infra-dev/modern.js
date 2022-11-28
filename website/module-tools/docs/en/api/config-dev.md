# Dev

## storybook

For Storybook configuration see: [Storybook Configuration](https://storybook.js.org/docs/react/configure/overview)

:::info
To use Storybook for debugging, you need to enable the "Visual Testing (Storybook)" mode feature by executing the new command under the project in advance.
:::

```js
export default {
  dev: {
    storybook: {
      addons: ['@storybook/addon-essentials'],
      babel: async (options) => ({
        // Update your babel configuration here
        ...options,
      }),
      framework: '@storybook/react',
      stories: ['../src/**/*.stories.@(js|mdx)'],
      webpackFinal: async (config, { configType }) => {
        // Make whatever fine-grained changes you need
        // Return the altered config
        return config;
      },
    }
  }
}

```

