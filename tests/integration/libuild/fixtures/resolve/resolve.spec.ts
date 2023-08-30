import { getLibuilderTest } from '@/toolkit';

describe('fixture:resolve', () => {
  it('this.resolve', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        main: './index.ts',
      },
      plugins: [
        {
          name: 'external',
          apply(compiler) {
            compiler.hooks.resolve.tapPromise('external', async args => {
              // esbuild doesn't supports skipSelf now, so we need an hack to tackle this
              if (!args.path.includes('?skipSelf')) {
                const result = await compiler.resolve(
                  `${args.path}?skipSelf`,
                  args,
                );
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
  it('resolve_with_virtual', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        main: './other.ts',
      },
      plugins: [
        {
          name: 'external',
          apply(compiler) {
            compiler.hooks.resolve.tapPromise('external', async args => {
              if (args.path.startsWith('~virtual')) {
                return { path: args.path };
              }
            });
            compiler.hooks.load.tapPromise('external', async args => {
              if (args.path.startsWith('~virtual')) {
                return {
                  contents: `import answer from "the-answer"; export default answer;`,
                  loader: 'js',
                };
              }
            });
          },
        },
      ],
    });
    await bundler.build();
    bundler.expectJSOutputMatchSnapshot();
  });
  it('resolve_with_false', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        index: './false.ts',
      },
    });
    await bundler.build();
  });
});
