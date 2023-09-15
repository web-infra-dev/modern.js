import path from 'path';
import { rebaseUrls } from '../../src/builder/feature/style/utils';

describe('rebase', () => {
  it('rebaseUrl', async () => {
    const rootFile = path.resolve(__dirname, 'index.less');
    const file = path.resolve(__dirname, 'less/common.less');
    const result = await rebaseUrls(
      file,
      path.dirname(rootFile),
      (id: string, dir: string) => {
        return path.resolve(dir, id);
      },
    );
    expect(result.contents?.replace(/\\\\/g, '/')).toContain('less/a.png');
  });
  it('rebaseUrl original', async () => {
    const rootFile = path.resolve(__dirname, 'index.less');
    const file = path.resolve(__dirname, 'index.less');
    const result = await rebaseUrls(
      file,
      path.dirname(rootFile),
      (id: string, dir: string) => {
        return path.resolve(dir, id);
      },
    );
    expect(result.contents).toBeFalsy();
  });
  it('rebase with absolute url', async () => {
    const rootFile = path.resolve(__dirname, 'index.less');
    const file = path.resolve(__dirname, 'less/absolute.less');
    const result = await rebaseUrls(
      file,
      path.dirname(rootFile),
      (id: string, dir: string) => {
        return path.resolve(dir, id);
      },
    );
    expect(result.contents?.replace(/\\\\/g, '/')).toContain('/a.png');
  });
  it('do not replace variable', async () => {
    const rootFile = path.resolve(__dirname, 'index.less');
    const file = path.resolve(__dirname, 'less/variable.less');
    let replace = false;
    await rebaseUrls(
      file,
      path.dirname(rootFile),
      (id: string, dir: string) => {
        replace = true;
        return path.resolve(dir, id);
      },
    );
    expect(replace).toBeFalsy();
  });
});
