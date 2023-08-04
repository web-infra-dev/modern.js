import assert from 'assert';
import { getLibuilderTest } from '@/toolkit';

describe('virtual_module', () => {
  /**
   * support query in native resolve
   */
  it('native_query', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      plugins: [
        {
          name: 'virtual',
          apply(compiler) {
            compiler.hooks.load.tap('virtual', (args) => {
              if (args.path.includes('?raw')) {
                return {
                  contents: `export default "this is raw"`,
                  loader: 'js',
                };
              }
            });

            compiler.hooks.processAssets.tap('virtual', (args) => {
              let hasRaw = false;
              for (const item of args.values()) {
                if (item.contents.includes('this is raw')) {
                  hasRaw = true;
                }
              }
              assert(hasRaw, 'not include stub raw content');
            });
          },
        },
      ],
    });
    await bundler.build();
  });
});
