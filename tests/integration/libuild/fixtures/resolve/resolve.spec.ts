import { getLibuilderTest } from '@/toolkit';
import path from 'path';
describe('fixture:resolve', () => {
  it('this.resolve', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
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
      configFile: path.resolve(__dirname, './libuild.config.resolve.ts'),
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
