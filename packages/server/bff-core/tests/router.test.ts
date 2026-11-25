import path from 'path';
import { type APIHandlerInfo, Api, ApiRouter, HttpMethod, Put } from '../src';

const PWD = path.resolve(__dirname, '../fixtures/function');

describe('test api router', () => {
  const mockApiDir = path.join(__dirname, 'fixtures', 'function');
  let apiRouter: ApiRouter;
  beforeAll(() => {
    apiRouter = new ApiRouter({
      apiDir: mockApiDir,
      lambdaDir: path.join(mockApiDir, 'lambda'),
      prefix: '/',
    });
  });

  test.each([
    ['index.ts', '/'],
    ['foo.ts', '/foo'],
    ['foo/test.ts', '/foo/test'],
    ['[id]/foo.ts', '/:id/foo'],
    ['foo/index.ts', '/foo'],
  ])('normalizes the route for %s', (filename, routePath) => {
    expect(
      apiRouter.getHandlerInfo(
        path.join(mockApiDir, 'lambda', filename),
        'get',
        () => 'ok',
      )?.routePath,
    ).toBe(routePath);
  });

  test('support get http method from function name', () => {
    const mockFileName = path.join(mockApiDir, 'lambda', 'repo.ts');
    const mockFuncName = 'del';
    const del = () => {};

    const handlerInfo = apiRouter.getHandlerInfo(
      mockFileName,
      mockFuncName,
      del as any,
    ) as APIHandlerInfo;

    expect(handlerInfo.routePath).toBe('/repo');
    expect(handlerInfo.httpMethod).toBe(HttpMethod.Delete);
  });

  test('get http method from function name correctly', () => {
    expect(apiRouter.getHttpMethod('default')).toBe(HttpMethod.Get);
    expect(apiRouter.getHttpMethod('get')).toBe(HttpMethod.Get);
    expect(apiRouter.getHttpMethod('Get')).toBe(HttpMethod.Get);
    expect(apiRouter.getHttpMethod('post')).toBe(HttpMethod.Post);
    expect(apiRouter.getHttpMethod('put')).toBe(HttpMethod.Put);
    expect(apiRouter.getHttpMethod('delete')).toBe(HttpMethod.Delete);
    expect(apiRouter.getHttpMethod('del')).toBe(HttpMethod.Delete);
    expect(apiRouter.getHttpMethod('DELETE')).toBe(HttpMethod.Delete);
    expect(apiRouter.getHttpMethod('connect')).toBe(HttpMethod.Connect);
    expect(apiRouter.getHttpMethod('trace')).toBe(HttpMethod.Trace);
    expect(apiRouter.getHttpMethod('patch')).toBe(HttpMethod.Patch);
    expect(apiRouter.getHttpMethod('options')).toBe(HttpMethod.Options);
  });

  test('support get http method from Trigger', () => {
    const mockFileName = '/api';
    const mockRoute = '/api/repo.ts';
    const mockFuncName = 'putRepo';
    const putRepo = Api(Put(mockRoute), async () => {
      return null;
    });

    const handlerInfo = apiRouter.getHandlerInfo(
      mockFileName,
      mockFuncName,
      putRepo as any,
    ) as APIHandlerInfo;

    expect(handlerInfo.httpMethod).toBe(HttpMethod.Put);
    expect(handlerInfo.routePath).toBe(mockRoute);
  });

  test('getSingleModuleHandlers', async () => {
    const apiDir = path.join(__dirname, 'fixtures', 'function');
    const apiFile = path.join(apiDir, 'lambda/normal/origin/index.ts');
    const apiRouter = new ApiRouter({
      apiDir,
      lambdaDir: path.join(apiDir, 'lambda'),
      prefix: '/',
    });
    const handlerInfos = await apiRouter.getSingleModuleHandlers(apiFile);
    const methods = handlerInfos?.map(handlerInfo => handlerInfo.httpMethod);
    expect(methods?.length).toBe(3);
    expect(methods).toEqual(['DELETE', 'GET', 'PUT']);
  });

  test('literal routes take precedence over parameter routes', async () => {
    const handlers = await apiRouter.getApiHandlers();
    const routes = handlers
      .filter(
        handler =>
          handler.httpMethod === HttpMethod.Get &&
          handler.routePath.endsWith('/origin/foo'),
      )
      .map(handler => handler.routePath);
    expect(routes).toEqual(['/normal/origin/foo', '/:id/origin/foo']);
  });

  test('getHandlerInfo', () => {
    const apiDir = path.join(__dirname, 'fixtures', 'function');
    const get = () => 'Hello Modernjs';
    const apiRouter1 = new ApiRouter({
      apiDir,
      lambdaDir: path.join(apiDir, 'lambda'),
      prefix: '',
    });

    const handlerInfo1 = apiRouter1.getHandlerInfo(
      path.join(apiDir, 'lambda/normal/origin/index.ts'),
      'get',
      get,
    );
    expect(handlerInfo1?.routePath).toEqual('/api/normal/origin');

    const apiRouter2 = new ApiRouter({
      apiDir,
      lambdaDir: path.join(apiDir, 'lambda'),
      prefix: '/',
    });
    const handlerInfo2 = apiRouter2.getHandlerInfo(
      path.join(apiDir, 'lambda/normal/origin/index.ts'),
      'get',
      get,
    );
    expect(handlerInfo2?.routePath).toEqual('/normal/origin');

    const apiRouter3 = new ApiRouter({
      apiDir,
      prefix: '',
    });
    const handlerInfo3 = apiRouter3.getHandlerInfo(
      path.join(apiDir, 'lambda/index.ts'),
      'get',
      get,
    );
    expect(handlerInfo3?.routePath).toEqual('/api');

    const apiRouter4 = new ApiRouter({
      apiDir,
      lambdaDir: path.join(apiDir, 'lambda'),
      prefix: '/',
    });
    const handlerInfo4 = apiRouter4.getHandlerInfo(
      path.join(apiDir, 'lambda/index.ts'),
      'get',
      get,
    );
    expect(handlerInfo4?.routePath).toEqual('/');

    const prefixedRouter = new ApiRouter({
      apiDir,
      lambdaDir: path.join(apiDir, 'lambda'),
      prefix: '/api',
    });
    expect(
      prefixedRouter.getHandlerInfo(
        path.join(apiDir, 'lambda/[id]/origin/foo.ts'),
        'get',
        get,
      )?.routePath,
    ).toBe('/api/:id/origin/foo');
  });

  test('getSafeRoutePath should throw error when file is not a api file', () => {
    const apiRouter = new ApiRouter({
      apiDir: PWD,
      lambdaDir: path.join(PWD, 'lambda'),
      prefix: '/',
    });
    const resourcePath = path.resolve(
      __dirname,
      './fixtures/function/_fail.ts',
    );
    expect(() => apiRouter.getSafeRoutePath(resourcePath)).toThrow(
      new Error(`The ${resourcePath} is not a valid api file.`),
    );
  });

  test('getSafeRoutePath should throw error when filename is not a absolute path', () => {
    const resourcePath = './fixtures/function/_fail.ts';
    const apiRouter = new ApiRouter({
      apiDir: PWD,
      lambdaDir: path.join(PWD, 'lambda'),
      prefix: '/',
    });
    expect(() => apiRouter.getSafeRoutePath(resourcePath)).toThrow(
      new Error(`The ${resourcePath} is not a valid api file.`),
    );
  });

  test('getApiHandlers should filter out modules that fail to load in non-production', async () => {
    const apiDir = path.join(__dirname, 'fixtures', 'with-errors');
    const lambdaDir = path.join(apiDir, 'lambda');
    const apiRouter = new ApiRouter({
      apiDir,
      lambdaDir,
      prefix: '/',
    });

    const consoleSpy = rstest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const handlerInfos = await apiRouter.getApiHandlers();

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain('broken');
    expect(handlerInfos.length).toBe(1);
    expect(handlerInfos[0].routePath).toBe('/valid');

    consoleSpy.mockRestore();
  });

  test('getApiHandlers should include filename in error when module fails to load in production', async () => {
    const apiDir = path.join(__dirname, 'fixtures', 'with-errors');
    const lambdaDir = path.join(apiDir, 'lambda');
    const apiRouter = new ApiRouter({
      apiDir,
      lambdaDir,
      prefix: '/',
    });

    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      await expect(apiRouter.getApiHandlers()).rejects.toThrow(/broken/);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
