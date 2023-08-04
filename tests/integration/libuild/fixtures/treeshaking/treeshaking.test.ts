import { getLibuilderTest } from '@/toolkit';
import assert from 'assert';

describe('fixture:treeshaking', () => {
  it('shaking:resolve', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
    });
    await bundler.build();
    const jsOutput = bundler.getJSOutput();
    const code = Object.values(jsOutput)[0].contents;
    assert(!code.includes('side effect'));
    bundler.expectJSOutputMatchSnapshot();
  });
});
