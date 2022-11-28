# Dev
本章描述了调试相关的配置
## storybook

Storybook 配置请查看：[Storybook 配置](https://storybook.js.org/docs/react/configure/overview)

:::info
使用 Storybook 进行调试需要提前在项目下执行 new 命令启用「Visual Testing (Storybook)」模式功能。
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
