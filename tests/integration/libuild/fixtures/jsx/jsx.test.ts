import { getLibuilderTest } from '@/toolkit';

describe('fixture:jsx', () => {
  it('jsx automatic', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        automatic: './automatic.tsx',
      },
      jsx: 'automatic',
    });
    await bundler.build();

    bundler.expectJSOutputMatchSnapshot();
  });
  it('jsx preserve', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        preserve: './default.tsx',
      },
      jsx: 'preserve',
    });
    await bundler.build();

    bundler.expectJSOutputMatchSnapshot();
  });
  it('jsx transform', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        tranform: './default.tsx',
      },
      jsx: 'transform',
    });
    await bundler.build();

    bundler.expectJSOutputMatchSnapshot();
  });
  it('jsx default', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        default: './automatic.tsx',
      },
    });
    await bundler.build();

    bundler.expectJSOutputMatchSnapshot();
  });
});
