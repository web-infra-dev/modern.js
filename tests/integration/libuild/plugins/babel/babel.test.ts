import { expect, getLibuilderTest } from '@/toolkit';

describe('fixture:plugin:babel', function () {
  it('plugin:babel', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
    });
    await bundler.build();

    const jsOutput = Object.values(bundler.getJSOutput());
    expect(jsOutput[0].contents).toMatchSnapshot();
  });
});
