import path from 'path';
import {
  type ServerPlugin,
  compatPlugin,
  createServerBase,
} from '@modern-js/server-core';
import { getMockMiddleware } from '../src/helpers';

function getDefaultConfig() {
  return {
    html: {},
    output: {},
    source: {},
    tools: {},
    server: {},
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

function createMockPlugin(pwd: string): ServerPlugin {
  return {
    name: 'mock-plugin',
    setup(api) {
      api.onPrepare(async () => {
        const mockMiddleware = await getMockMiddleware(pwd);
        const { middlewares } = api.getServerContext();

        middlewares.push({
          name: 'mock',
          handler: mockMiddleware,
        });
      });
    },
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

    server.addPlugins([
      compatPlugin(),
      createMockPlugin(path.join(pwd, 'cjs')),
    ]);

    await server.init();

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

    server.addPlugins([
      compatPlugin(),
      createMockPlugin(path.join(pwd, 'empty')),
    ]);

    await server.init();

    const response = await server.request('/api/getInfo');
    expect(response.status).toBe(404);
  });

  it('support post method', async () => {
    const server = createServerBase({
      config: getDefaultConfig(),
      appContext: getDefaultAppContext(),
      pwd: '',
    });

    server.addPlugins([
      compatPlugin(),
      createMockPlugin(path.join(pwd, 'exist')),
    ]);

    await server.init();

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

    server.addPlugins([
      compatPlugin(),
      createMockPlugin(path.join(pwd, 'exist')),
    ]);

    await server.init();

    const response = await server.request('/api/xxx');
    expect(response.status).toBe(404);
  });

  it('should not return 404 if mock disable', async () => {
    const server = createServerBase({
      config: getDefaultConfig(),
      pwd: '',
      appContext: getDefaultAppContext(),
    });

    server.addPlugins([
      compatPlugin(),
      createMockPlugin(path.join(pwd, 'disable')),
    ]);

    await server.init();

    const response = await server.request('/api/getInfo');
    expect(response.status).toBe(404);
  });

  it('should not return 404 if enable is a function', async () => {
    const server = createServerBase({
      config: getDefaultConfig(),
      pwd: '',
      appContext: getDefaultAppContext(),
    });

    server.addPlugins([
      compatPlugin(),
      createMockPlugin(path.join(pwd, 'disable-runtime')),
    ]);

    await server.init();

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

      server.addPlugins([
        compatPlugin(),
        createMockPlugin(path.join(pwd, 'module-error')),
      ]);

      await server.init();
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

      server.addPlugins([
        compatPlugin(),
        createMockPlugin(path.join(pwd, 'type-error')),
      ]);

      await server.init();
    } catch (e: any) {
      expect(e.message).toMatch('should be object or function, but got string');
    }
  });
});
