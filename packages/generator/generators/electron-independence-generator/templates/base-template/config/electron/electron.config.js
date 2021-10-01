const { installDep, compileDep } = require('@modern-js/electron-tools');

module.exports = {
  builder: {
    baseConfig: {
      extraMetadata: { name: 'Demo' },
      appId: 'com.bytedance.demo',
      // eslint-disable-next-line no-template-curly-in-string
      artifactName: 'demo_${env.VERSION}.${ext}',
      beforeBuild: async context => {
        await installDep(context.appDir);
        await compileDep(context.appDir);
        return false;
      },
      files: [
        { from: '../assets', to: 'assets' },
        {
          from: '.',
          to: '.',
          filter: ['!**/*.map', '!**/*.d.ts', '!*.log', '!*.lock'],
        },
      ],
      extraResources: [
        {
          from: 'dist/node_modules',
          to: 'node_modules',
          filter: [
            '!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
            '!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
            '!**/node_modules/*.d.ts',
            '!dist/node_modules/@types',
            '!dist/node_modules/electron',
            '!dist/node_modules/core-js',
          ],
        },
      ],

      directories: { app: 'dist' },
    },
  },
};
