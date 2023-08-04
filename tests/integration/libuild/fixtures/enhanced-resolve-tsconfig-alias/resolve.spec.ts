import { getLibuilderTest } from '@/toolkit';

describe('fixture:enhanced-resolve-tsconfig-alias', () => {
  it('index', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      plugins: [
        {
          name: 'external',
          apply(compiler) {
            compiler.hooks.resolve.tapPromise('external', async (args) => {
              // esbuild doesn't supports skipSelf now, so we need an hack to tackle this
              if (!args.path.includes('?skipSelf')) {
                const result = await compiler.resolve(`${args.path}?skipSelf`, args);
                if (result.path.includes('node_modules')) {
                  return {
                    path: args.path,
                    external: true,
                  };
                }
              }
            });
          },
        },
      ],
    });
    await bundler.build();
    bundler.expectJSOutputMatchSnapshot();
  });
});
