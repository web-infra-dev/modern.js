import assert from 'assert';
import path from 'path';
import { getLibuilderTest } from '@/toolkit';

describe('errors', () => {
  it('custom error should be LibuildError', async () => {
    const bundler = await getLibuilderTest({
      root: path.resolve(__dirname, '../'),
    });
    try {
      await bundler.build();
    } catch (err: any) {
      assert('errors' in err);
      assert('warnings' in err);
      err.errors.forEach((item: any) => assert(item.constructor.name === 'LibuildError'));
    }
  });
  it('LibuildError toString', async () => {
    const bundler = await getLibuilderTest({
      root: path.resolve(__dirname, '../'),
    });
    try {
      await bundler.build();
    } catch (err: any) {
      const errorStr = err.toString();
      assert(errorStr.includes('[LIBUILD:NODE_RESOLVE_FAILED]'));
    }
  });
});
