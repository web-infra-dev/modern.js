import path from 'path';
import { Api } from '../src';
import { Put } from '../src/operators/http';
import { ApiRouter } from '../src/router';
import { HttpMethod } from '../src/types';
import { getPathFromFilename } from '../src/router/utils';

describe('test getPathFromFilename', () => {
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
    );

    expect(handlerInfo.routePath).toBe('/repo');
    expect(handlerInfo.httpMethod).toBe(HttpMethod.Delete);
  });

  test('get http method from function name correctly', () => {
    expect(apiRouter.getHttpMethod('get')).toBe(HttpMethod.Get);
    expect(apiRouter.getHttpMethod('post')).toBe(HttpMethod.Post);
    expect(apiRouter.getHttpMethod('put')).toBe(HttpMethod.Put);
    expect(apiRouter.getHttpMethod('delete')).toBe(HttpMethod.Delete);
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
    );

    expect(handlerInfo.httpMethod).toBe(HttpMethod.Put);
    expect(handlerInfo.routePath).toBe(mockRoute);
  });

  test('getAllAPIFiles', () => {
    const apiDir = path.join(__dirname, 'fixtures', 'function');
    const apiRouter = new ApiRouter({
      apiDir,
    });
    const filenames = apiRouter.getApiFiles();
    expect(filenames.length).toBe(13);
  });

  test('getAllApiHandlers', () => {
    const apiDir = path.join(__dirname, 'fixtures', 'function');
    const apiRouter = new ApiRouter({
      apiDir,
    });
    const handlerInfos = apiRouter.getApiHandlers();
    expect(handlerInfos.length).toBe(26);
  });
});
