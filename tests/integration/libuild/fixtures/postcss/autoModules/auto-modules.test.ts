import { expect, getLibuilderTest } from '@/toolkit';

describe('fixture:postcss:auto-modules', () => {
  it('unable css modules', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        index: './index.css',
      },
      style: {
        autoModules: false,
      },
    });
    await bundler.build();
    expect(Object.values(bundler.getJSOutput()).length === 0).to.be.true;
  });
  it('enable css modules for *.css', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        index: './index.css',
      },
      style: {
        autoModules: /^.+\.css$/,
      },
    });
    await bundler.build();
    expect(Object.values(bundler.getJSOutput()).length === 1).to.be.true;
  });
});
