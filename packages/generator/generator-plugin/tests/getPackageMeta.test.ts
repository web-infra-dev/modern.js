import { getPackageMeta } from '../src/utils/getPackageMeta';

describe('getPackageMeta test', () => {
  it('get @modern-js/generator-plugin-plugin meta', async () => {
    const meta = await getPackageMeta(
      '@modern-js/generator-plugin-plugin',
      'latest',
    );
    expect(meta).toEqual({
      meta: {
        key: 'generator-plugin',
        name: '生成器插件',
        type: 'module',
      },
    });
  });
});
