import path from 'path';
import { createServerBase } from '@modern-js/server-core';
import { registerMockHandlers } from '../src/helpers';

function getDefaultConfig() {
  return {
    html: {},
    output: {},
    source: {},
    tools: {},
    server: {},
    runtime: {},
    bff: {},
    dev: {},
    security: {},
  };
}

function getDefaultAppContext() {
  return {
    apiDirectory: '',
    lambdaDirectory: '',
  };
}

describe('should mock middleware work correctly', () => {
  const pwd = path.join(__dirname, './fixtures/mock');

  it('support cjs', async () => {
    const server = createServerBase({
      config: getDefaultConfig(),
      appContext: getDefaultAppContext(),
      pwd: '',
    });

    await registerMockHandlers({
      server,
      pwd: path.join(pwd, 'cjs'),
    });

    const response = await server.request('/api/getInfo');
    const data = await response.json();

    expect(data).toEqual({
      data: [1, 2, 3, 4],
    });

    const response1 = await server.request('/api/getExample');
    const data1 = await response1.json();

    expect(data1).toEqual({ id: 1 });
  });

  it('should not handle if no config mock dir', async () => {
    const server = createServerBase({
      config: getDefaultConfig(),
      appContext: getDefaultAppContext(),
      pwd: '',
    });
    await registerMockHandlers({
      server,
      pwd: path.join(pwd, 'empty'),
    });
    const response = await server.request('/api/getInfo');
    expect(response.status).toBe(404);
  });

  it('support post method', async () => {
    const server = createServerBase({
      config: getDefaultConfig(),
      appContext: getDefaultAppContext(),
      pwd: '',
    });
    await registerMockHandlers({
      server,
      pwd: path.join(pwd, 'exist'),
    });
    const response = await server.request('/api/getInfo', {
      method: 'post',
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      data: [1, 2, 3, 4],
    });
  });

  it('should return 404 if mock api not exist', async () => {
    const server = createServerBase({
      config: getDefaultConfig(),
      pwd: '',
      appContext: getDefaultAppContext(),
    });
    await registerMockHandlers({
      server,
      pwd: path.join(pwd, 'exist'),
    });
    const response = await server.request('/api/xxx');
    expect(response.status).toBe(404);
  });

  it('should not return 404 if mock disable', async () => {
    const server = createServerBase({
      config: getDefaultConfig(),
      pwd: '',
      appContext: getDefaultAppContext(),
    });
    await registerMockHandlers({
      server,
      pwd: path.join(pwd, 'disable'),
    });
    const response = await server.request('/api/getInfo');
    expect(response.status).toBe(404);
  });

  it('should not return 404 if enable is a function', async () => {
    const server = createServerBase({
      config: getDefaultConfig(),
      pwd: '',
      appContext: getDefaultAppContext(),
    });
    await registerMockHandlers({
      server,
      pwd: path.join(pwd, 'disable-runtime'),
    });
    const response = await server.request('/api/getInfo', undefined, {
      node: {
        req: {},
        res: {},
      },
    });
    expect(response.status).toBe(404);
  });

  it('should throw error if get mock file fail', async () => {
    try {
      const server = createServerBase({
        config: getDefaultConfig(),
        pwd: '',
        appContext: getDefaultAppContext(),
      });
      await registerMockHandlers({
        server,
        pwd: path.join(pwd, 'module-error'),
      });
    } catch (e: any) {
      expect(e.message).toMatch('parsed failed!');
    }
  });

  it('should throw error if get mock api has wrong type', async () => {
    try {
      const server = createServerBase({
        config: getDefaultConfig(),
        pwd: '',
        appContext: getDefaultAppContext(),
      });
      await registerMockHandlers({
        server,
        pwd: path.join(pwd, 'type-error'),
      });
    } catch (e: any) {
      expect(e.message).toMatch('should be object or function, but got string');
    }
  });
});
