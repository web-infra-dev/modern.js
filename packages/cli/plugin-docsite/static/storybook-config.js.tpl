module.exports = {
  stories: [
    '<%= rootDir %>/stories/**/*.{js,jsx,ts,tsx}',
    '<%= rootDir %>/src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  addons: [
    '@storybook/addon-actions',
    '@storybook/addon-links',
    {
      name: '@storybook/addon-storysource',
      options: {
        rule: {
          test: {
            or: [
              {
                test: [/.stories.{js,ts}x?$/],
              },
              {
                include: '<%= rootDir %>/stories',
              },
            ],
          },
        },
        loaderOptions: {
          parser: 'typescript',
          prettierConfig: { printWidth: 80, singleQuote: false },
        },
      },
    },
    '@storybook/addon-viewport',
  ],
};
