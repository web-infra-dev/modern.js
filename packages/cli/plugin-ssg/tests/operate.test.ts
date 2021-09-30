import { fs } from '@modern-js/utils';
import { LoaderManifest, manifest } from '@/manifest-op';

describe('test ssg manifest operate', () => {
  beforeAll(() => {
    if (fs.existsSync(manifest)) {
      fs.unlinkSync(manifest);
    }
  });

  test('should get correctly initial data', () => {
    const loaderManifest = new LoaderManifest();
    expect(loaderManifest.content).toEqual({
      file_1: [],
      file_2: [],
      file_3: [],
    });
  });

  test('should add file correctly', () => {
    const loaderManifest = new LoaderManifest();
    loaderManifest.add('/foo.js', 1);
    loaderManifest.add('/bar.js', 2);
    loaderManifest.add('/dir/baz.js', 2);
    loaderManifest.add('/dir/foo.js', 3);
    expect(loaderManifest.content).toEqual({
      file_1: ['/foo.js'],
      file_2: ['/bar.js', '/dir/baz.js'],
      file_3: ['/dir/foo.js'],
    });
  });

  test('should get file correctly', () => {
    const loaderManifest = new LoaderManifest();
    expect(loaderManifest.get('/', 1)).toEqual(['/foo.js']);
    expect(loaderManifest.get('/dir', 2)).toEqual(['/dir/baz.js']);
    expect(loaderManifest.get('/unknow', 3)).toEqual([]);
  });
});
