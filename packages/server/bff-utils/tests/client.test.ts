import fs from 'fs';
import assert from 'assert';
import path from 'path';
import { generateClient, getMethodAndStatementFromName } from '../src';
import { checkSource } from '../src/client/check-source';
import { getRouteName } from '../src/client/get-route-name';
import { HttpMethod } from '../src/constant';

const PWD = path.resolve(__dirname, './fixtures/function');

describe('client', () => {
  describe('generateClient', () => {
    it('should work well', async () => {
      const prefix = '';
      const port = 3000;
      const resourcePath = path.resolve(
        __dirname,
        './fixtures/function/[id]/origin/foo.ts',
      );
      const source = fs.readFileSync(resourcePath, 'utf-8');

      jest.mock(
        '@modern-js/create-request',
        () => ({
          __esModule: true,
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          createRequest: () => {},
        }),
        { virtual: true },
      );
      const result = await generateClient({
        prefix,
        port,
        resourcePath,
        source,
        apiDir: PWD,
        requireResolve: ((input: any) => input) as any,
      });
      expect(result.isOk).toBeTruthy();
      expect(result.value)
        .toMatch(`import { createRequest } from '@modern-js/create-request';

export const get = createRequest('/:id/origin/foo', 'GET', process.env.PORT || 3000);
export const post = createRequest('/:id/origin/foo', 'POST', process.env.PORT || 3000);
`);
    });

    it('custom requestCreator', async () => {
      const prefix = '';
      const port = 3000;
      const resourcePath = path.resolve(
        __dirname,
        './fixtures/function/[id]/origin/foo.ts',
      );
      const source = fs.readFileSync(resourcePath, 'utf-8');

      const result = await generateClient({
        prefix,
        port,
        resourcePath,
        source,
        apiDir: PWD,
        requestCreator: '@custom/createRequest',
      });
      expect(result.isOk).toBeTruthy();
      expect(result.value)
        .toMatch(`import { createRequest } from '@custom/createRequest';

export const get = createRequest('/:id/origin/foo', 'GET', process.env.PORT || 3000);
export const post = createRequest('/:id/origin/foo', 'POST', process.env.PORT || 3000);
`);
    });

    it('custom fetcher', async () => {
      const prefix = '';
      const port = 3000;
      const resourcePath = path.resolve(
        __dirname,
        './fixtures/function/[id]/origin/foo.ts',
      );
      const source = fs.readFileSync(resourcePath, 'utf-8');

      jest.mock(
        '@modern-js/create-request',
        () => ({
          __esModule: true,
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          createRequest: () => {},
        }),
        { virtual: true },
      );
      const result = await generateClient({
        prefix,
        port,
        resourcePath,
        source,
        apiDir: PWD,
        fetcher: '@custom/fetcher',
        requireResolve: ((input: any) => input) as any,
      });
      expect(result.isOk).toBeTruthy();
      expect(result.value)
        .toMatch(`import { createRequest } from '@modern-js/create-request';
import { fetch } from '@custom/fetcher';

export const get = createRequest('/:id/origin/foo', 'GET', process.env.PORT || 3000, fetch);
export const post = createRequest('/:id/origin/foo', 'POST', process.env.PORT || 3000, fetch);
`);
    });
  });

  describe('getMethodAndStatementFromName', () => {
    it('should support normal http method', () => {
      const result0 = getMethodAndStatementFromName('get');

      expect(result0.isOk).toBeTruthy();
      assert(result0.isOk);
      expect(result0.value[0]).toBe(HttpMethod.GET);
      expect(result0.value[1]).toBe('const get =');

      const result1 = getMethodAndStatementFromName('post');

      expect(result1.isOk).toBeTruthy();
      assert(result1.isOk);
      expect(result1.value[0]).toBe(HttpMethod.POST);
      expect(result1.value[1]).toBe('const post =');

      const result2 = getMethodAndStatementFromName('put');

      expect(result2.isOk).toBeTruthy();
      assert(result2.isOk);
      expect(result2.value[0]).toBe(HttpMethod.PUT);
      expect(result2.value[1]).toBe('const put =');

      const result3 = getMethodAndStatementFromName('delete');

      expect(result3.isOk).toBeTruthy();
      assert(result3.isOk);
      expect(result3.value[0]).toBe(HttpMethod.DELETE);
      expect(result3.value[1]).toBe('const delete =');

      const result4 = getMethodAndStatementFromName('connect');

      expect(result4.isOk).toBeTruthy();
      assert(result4.isOk);
      expect(result4.value[0]).toBe(HttpMethod.CONNECT);
      expect(result4.value[1]).toBe('const connect =');

      const result5 = getMethodAndStatementFromName('trace');

      expect(result5.isOk).toBeTruthy();
      assert(result5.isOk);
      expect(result5.value[0]).toBe(HttpMethod.TRACE);
      expect(result5.value[1]).toBe('const trace =');

      const result6 = getMethodAndStatementFromName('patch');

      expect(result6.isOk).toBeTruthy();
      assert(result6.isOk);
      expect(result6.value[0]).toBe(HttpMethod.PATCH);
      expect(result6.value[1]).toBe('const patch =');

      const result7 = getMethodAndStatementFromName('option');

      expect(result7.isOk).toBeTruthy();
      assert(result7.isOk);
      expect(result7.value[0]).toBe(HttpMethod.OPTION);
      expect(result7.value[1]).toBe('const option =');
    });

    it('del should get DELETE method', () => {
      const result = getMethodAndStatementFromName('del');

      expect(result.isOk).toBeTruthy();
      assert(result.isOk);
      expect(result.value[0]).toBe(HttpMethod.DELETE);
      expect(result.value[1]).toBe('const del =');
    });

    it('default should get GET method', () => {
      const result = getMethodAndStatementFromName('default');

      expect(result.isOk).toBeTruthy();
      assert(result.isOk);
      expect(result.value[0]).toBe(HttpMethod.GET);
      expect(result.value[1]).toBe('default');
    });

    it('should case insensitive at method and case sensitive at valuable name', () => {
      const result0 = getMethodAndStatementFromName('Get');

      expect(result0.isOk).toBeTruthy();
      assert(result0.isOk);
      expect(result0.value[0]).toBe(HttpMethod.GET);
      expect(result0.value[1]).toBe('const Get =');

      const resul1 = getMethodAndStatementFromName('gEt');

      expect(resul1.isOk).toBeTruthy();
      assert(resul1.isOk);
      expect(resul1.value[0]).toBe(HttpMethod.GET);
      expect(resul1.value[1]).toBe('const gEt =');

      const resul2 = getMethodAndStatementFromName('geT');

      expect(resul2.isOk).toBeTruthy();
      assert(resul2.isOk);
      expect(resul2.value[0]).toBe(HttpMethod.GET);
      expect(resul2.value[1]).toBe('const geT =');

      const resul3 = getMethodAndStatementFromName('GEt');

      expect(resul3.isOk).toBeTruthy();
      assert(resul3.isOk);
      expect(resul3.value[0]).toBe(HttpMethod.GET);
      expect(resul3.value[1]).toBe('const GEt =');

      const resul4 = getMethodAndStatementFromName('gET');

      expect(resul4.isOk).toBeTruthy();
      assert(resul4.isOk);
      expect(resul4.value[0]).toBe(HttpMethod.GET);
      expect(resul4.value[1]).toBe('const gET =');

      const resul5 = getMethodAndStatementFromName('GET');

      expect(resul5.isOk).toBeTruthy();
      assert(resul5.isOk);
      expect(resul5.value[0]).toBe(HttpMethod.GET);
      expect(resul5.value[1]).toBe('const GET =');
    });

    it('should fail with unknown http method', () => {
      const result = getMethodAndStatementFromName('foo');

      expect(result.isOk).toBeFalsy();
      assert(!result.isOk);
      expect(result.value).toBe('Unknown HTTP Method: FOO');
    });
  });

  describe('checkSource', () => {
    it('should work well', async () => {
      const filepath = path.resolve(
        __dirname,
        './fixtures/function/[id]/origin/bar.ts',
      );
      const source = fs.readFileSync(filepath, 'utf-8');
      const result = await checkSource(source);
      expect(result.isOk).toBeTruthy();
      assert(result.isOk);
      expect(result.value.length).toBe(2);
    });

    it('should fail when there is no export field', async () => {
      const filepath = path.resolve(__dirname, './fixtures/empty.ts');
      const source = fs.readFileSync(filepath, 'utf-8');
      const result = await checkSource(source);
      expect(result.isOk).toBeFalsy();
      assert(!result.isOk);
      expect(result.value).toBe('Without any export item, Expect one at least');
    });
  });

  describe('getRouteName', () => {
    it('should work well', () => {
      const resourcePath = path.resolve(
        __dirname,
        './fixtures/function/normal/origin/foo.ts',
      );
      const result = getRouteName(resourcePath, PWD);
      expect(result.isOk).toBeTruthy();
      assert(result.isOk);
      expect(result.value).toBe('/normal/origin/foo');
    });

    it('should work with params', () => {
      const resourcePath = path.resolve(
        __dirname,
        './fixtures/function/[id]/origin/foo.ts',
      );
      const result = getRouteName(resourcePath, PWD);
      expect(result.isOk).toBeTruthy();
      assert(result.isOk);
      expect(result.value).toBe('/:id/origin/foo');
    });

    it('should remove index suffix', () => {
      const resourcePath = path.resolve(
        __dirname,
        './fixtures/function/normal/origin/index.ts',
      );
      const result = getRouteName(resourcePath, PWD);
      expect(result.isOk).toBeTruthy();
      assert(result.isOk);
      expect(result.value).toBe('/normal/origin');
    });

    it('should fail when resource path is not in the pwd dir', () => {
      const resourcePath = path.resolve(__dirname, './fixtures/empty.ts');
      const result = getRouteName(resourcePath, PWD);
      expect(result.isOk).toBeFalsy();
      assert(!result.isOk);
      expect(result.value).toMatch('API file is not in API dir:');
    });

    it('should fail when resource path is not a legal api file path', () => {
      const resourcePath = path.resolve(
        __dirname,
        './fixtures/function/_fail.ts',
      );
      const result = getRouteName(resourcePath, PWD);
      expect(result.isOk).toBeFalsy();
      assert(!result.isOk);
      expect(result.value).toBe('Invalid API definition file');
    });

    it('should fail when resource path is not a legal api file path', () => {
      const resourcePath = path.resolve(
        __dirname,
        './fixtures/function/_fail.ts',
      );
      const result = getRouteName(resourcePath, PWD);
      expect(result.isOk).toBeFalsy();
      assert(!result.isOk);
      expect(result.value).toBe('Invalid API definition file');
    });

    it('should fail when resource path is not absolute path', () => {
      const resourcePath = './fixtures/function/_fail.ts';
      const result = getRouteName(resourcePath, PWD);
      expect(result.isOk).toBeFalsy();
      assert(!result.isOk);
      expect(result.value).toMatch(/API file path: .* is not absolute/);
    });

    it('should fail when api dir path is not absolute path', () => {
      const resourcePath = path.resolve(
        __dirname,
        './fixtures/function/_fail.ts',
      );
      const result = getRouteName(resourcePath, './fixtures/function');
      expect(result.isOk).toBeFalsy();
      assert(!result.isOk);
      expect(result.value).toMatch(/API dir path: .* is not absolute/);
    });
  });
});
