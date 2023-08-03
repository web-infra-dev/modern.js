import path from 'path';
import assert from 'assert';
import { rebaseUrls } from '../../../src/plugins/style/utils';

describe('rebase', () => {
  it('rebaseUrl', async () => {
    const rootFile = path.resolve(__dirname, 'index.less');
    const file = path.resolve(__dirname, 'less/common.less');
    const result = await rebaseUrls(file, path.dirname(rootFile), (id: string, dir: string) => {
      return path.resolve(dir, id);
    });
    assert(result.contents?.includes?.('less/a.png'), 'rewrite url');
  });
  it('rebaseUrl original', async () => {
    const rootFile = path.resolve(__dirname, 'index.less');
    const file = path.resolve(__dirname, 'index.less');
    const result = await rebaseUrls(file, path.dirname(rootFile), (id: string, dir: string) => {
      return path.resolve(dir, id);
    });

    assert(result.contents == null, 'rewrite url');
  });
  it('rebase with absolute url', async () => {
    const rootFile = path.resolve(__dirname, 'index.less');
    const file = path.resolve(__dirname, 'less/absolute.less');
    const result = await rebaseUrls(file, path.dirname(rootFile), (id: string, dir: string) => {
      return path.resolve(dir, id);
    });
    assert(result.contents?.includes?.('/a.png'), 'rewrite url with absolute url');
  });
  it('do not replace variable', async () => {
    const rootFile = path.resolve(__dirname, 'index.less');
    const file = path.resolve(__dirname, 'less/variable.less');
    let replace = false;
    await rebaseUrls(file, path.dirname(rootFile), (id: string, dir: string) => {
      replace = true;
      return path.resolve(dir, id);
    });
    assert(!replace);
  });
});
