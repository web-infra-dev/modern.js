import path from 'path';
import { Api } from '../src';
import { Put } from '../src/operators/http';
import { APIHandlerInfo, ApiRouter } from '../src/router';
import { HttpMethod } from '../src/types';
import { getPathFromFilename } from '../src/router/utils';

const PWD = path.resolve(__dirname, '../fixtures/function');

describe('test getPathFromFilename', () => {
  test('index path', () => {
    expect(getPathFromFilename('', path.normalize('/index.ts'))).toBe('/');
  });

  test('normal path', () => {
    expect(getPathFromFilename('', path.normalize('/foo.ts'))).toBe('/foo');
    expect(getPathFromFilename('', path.normalize('/foo/test.ts'))).toBe(
      '/foo/test',
    );
  });

  test('with params', () => {
    expect(getPathFromFilename('', path.normalize('/[id]/foo.ts'))).toBe(
      '/:id/foo',
    );
  });

  test('with index', () => {
    expect(getPathFromFilename('', path.normalize('/foo/index.ts'))).toBe(
      '/foo',
    );
  });
});

describe('test api router', () => {
  const mockApiDir = '/api';
  let apiRouter: ApiRouter;
  beforeAll(() => {
    apiRouter = new ApiRouter({
      apiDir: mockApiDir,
      prefix: '/',
    });
  });

  test('support get http method from function name', () => {
    const mockFileName = '/api/repo.ts';
    const mockFuncName = 'del';
    // eslint-disable-next-line @typescript-eslint/no-empty-function
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
    expect(apiRouter.getHttpMethod('option')).toBe(HttpMethod.Option);
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

  test('getSingleModuleHandlers', () => {
    const apiDir = path.join(__dirname, 'fixtures', 'function');
    const apiFile = path.join(apiDir, 'normal/origin/index');
    const apiRouter = new ApiRouter({
      apiDir,
      prefix: '/',
    });
    const handlerInfos = apiRouter.getSingleModuleHandlers(apiFile);
    const methods = handlerInfos?.map(handlerInfo => handlerInfo.httpMethod);
    expect(methods?.length).toBe(3);
    expect(methods).toEqual(['DELETE', 'GET', 'PUT']);
  });

  test('getAllAPIFiles', () => {
    const apiDir = path.join(__dirname, 'fixtures', 'function');
    const apiRouter = new ApiRouter({
      apiDir,
      prefix: '/',
    });
    const filenames = apiRouter.getApiFiles();
    expect(filenames.length).toBe(13);
  });

  test('getAllApiHandlers', () => {
    const apiDir = path.join(__dirname, 'fixtures', 'function');
    const apiRouter = new ApiRouter({
      apiDir,
      prefix: '/',
    });
    const handlerInfos = apiRouter.getApiHandlers();
    const routePaths = handlerInfos.map(handlerInfo => handlerInfo.routePath);
    expect(routePaths).toMatchSnapshot();
    expect(handlerInfos.length).toBe(27);
  });

  test('getHandlerInfo', () => {
    const apiDir = path.join(__dirname, 'fixtures', 'function');
    const get = () => 'Hello Modernjs';
    const apiRouter1 = new ApiRouter({
      apiDir,
      prefix: '',
    });
    const handlerInfo1 = apiRouter1.getHandlerInfo(
      path.join(apiDir, 'normal/origin/index.ts'),
      'get',
      get,
    );
    expect(handlerInfo1?.routePath).toEqual('/api/normal/origin');

    const apiRouter2 = new ApiRouter({
      apiDir,
      prefix: '/',
    });
    const handlerInfo2 = apiRouter2.getHandlerInfo(
      path.join(apiDir, 'normal/origin/index.ts'),
      'get',
      get,
    );
    expect(handlerInfo2?.routePath).toEqual('/normal/origin');

    const apiRouter3 = new ApiRouter({
      apiDir,
      prefix: '',
    });
    const handlerInfo3 = apiRouter3.getHandlerInfo(
      path.join(apiDir, 'index.ts'),
      'get',
      get,
    );
    expect(handlerInfo3?.routePath).toEqual('/api');

    const apiRouter4 = new ApiRouter({
      apiDir,
      prefix: '/',
    });
    const handlerInfo4 = apiRouter4.getHandlerInfo(
      path.join(apiDir, 'index.ts'),
      'get',
      get,
    );
    expect(handlerInfo4?.routePath).toEqual('/');
  });

  test('getSafeRoutePath should throw error when file is not a api file', () => {
    const apiRouter = new ApiRouter({
      apiDir: PWD,
      lambdaDir: PWD,
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
      lambdaDir: PWD,
      prefix: '/',
    });
    expect(() => apiRouter.getSafeRoutePath(resourcePath)).toThrow(
      new Error(`The ${resourcePath} is not a valid api file.`),
    );
  });
});
