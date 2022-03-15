import renderCreator from '../src/libs/render/cache';

const createCacheConfig = (config: any = {}) => ({
  excludes: null,
  includes: null,
  interval: 10,
  staleLimit: false,
  level: 0,
  fallback: false,
  matches: null,
  ...config,
});

describe('test serverless pre-render', () => {
  it('should return render function after invoke', async () => {
    const renderfn = async () => 'hello modern';
    const context = {
      entry: '',
      pathname: '',
      query: {},
      headers: {},
      res: {
        setHeader: () => false,
      },
    };
    const doRender = renderCreator(renderfn, context as any);

    const res = await doRender({
      cacheConfig: createCacheConfig(),
    } as any);
    expect(res).toBe(await renderfn());

    const res1 = await doRender({
      cacheConfig: createCacheConfig(),
    } as any);
    expect(res1).toBe(await renderfn());
  });
});
