import path from 'path';
import { IAppContext } from '@modern-js/core';
import { MAIN_ENTRY_NAME } from '@modern-js/utils';
import { getServerRoutes } from '../src/getServerRoutes';
import { Entrypoint } from '../src/getFileSystemEntry';

describe('get server routes', () => {
  const appContext: any = {
    appDirectory: path.resolve(__dirname, './fixtures/server-routes/no-config'),
  };

  const sourceConfig = { configDir: 'config' };

  const outputConfig = {
    htmlPath: 'html',
    disableHtmlFolder: false,
  };

  const serverConfig = { baseUrl: '/' };

  test(`should use entry name as server routes`, () => {
    const routes = getServerRoutes(
      [{ entryName: 'page-a' }, { entryName: 'page-b' }] as any,
      {
        appContext,
        config: {
          source: sourceConfig,
          output: outputConfig,
          server: serverConfig,
        } as any,
      },
    );

    expect(routes).toMatchObject([
      {
        urlPath: '/page-a',
        isSPA: true,
        isSSR: false,
        entryName: 'page-a',
        entryPath: 'html/page-a/index.html',
      },
      {
        urlPath: '/page-b',
        isSPA: true,
        isSSR: false,
        entryName: 'page-b',
        entryPath: 'html/page-b/index.html',
      },
    ]);
  });

  test(`should use custom route from server.routes`, () => {
    const routes = getServerRoutes(
      [{ entryName: 'page-a' }, { entryName: 'page-b' }] as any,
      {
        appContext,
        config: {
          source: sourceConfig,
          output: { ...outputConfig },
          server: {
            ...serverConfig,
            baseUrl: '/base/',
            ssr: false,
            ssrByEntries: { 'page-a': true },
            routes: { 'page-a': '/a' },
          },
        } as any,
      },
    );

    expect(routes).toMatchObject([
      {
        urlPath: '/base/a',
        entryName: 'page-a',
        entryPath: 'html/page-a/index.html',
        isSPA: true,
        isSSR: true,
        bundle: 'bundles/page-a.js',
      },
      {
        urlPath: '/base/page-b',
        entryName: 'page-b',
        entryPath: 'html/page-b/index.html',
        isSPA: true,
        isSSR: false,
      },
    ]);
  });

  test(`should support route array from server.routes`, () => {
    const routes = getServerRoutes(
      [{ entryName: 'page-a' }, { entryName: 'page-b' }] as any,
      {
        appContext,
        config: {
          source: sourceConfig,
          output: {
            ...outputConfig,
            disableHtmlFolder: true,
          },
          server: {
            ...serverConfig,
            routes: { 'page-a': ['/a', '/b', '/c'] },
          },
        },
      } as any,
    );

    expect(routes).toMatchObject([
      {
        urlPath: '/a',
        entryName: 'page-a',
        entryPath: 'html/page-a.html',
        isSPA: true,
        isSSR: false,
      },
      {
        urlPath: '/b',
        entryName: 'page-a',
        entryPath: 'html/page-a.html',
        isSPA: true,
        isSSR: false,
      },
      {
        urlPath: '/c',
        entryName: 'page-a',
        entryPath: 'html/page-a.html',
        isSPA: true,
        isSSR: false,
      },
      {
        urlPath: '/page-b',
        entryName: 'page-b',
        entryPath: 'html/page-b.html',
        isSPA: true,
        isSSR: false,
      },
    ]);
  });

  test(`should support multiple base url`, () => {
    const routes = getServerRoutes(
      [{ entryName: 'page-a' }, { entryName: 'page-b' }] as any,
      {
        appContext,
        config: {
          source: sourceConfig,
          output: outputConfig,
          server: { baseUrl: ['/a', '/b'] },
        } as any,
      },
    );

    expect(routes).toMatchObject([
      {
        urlPath: '/a/page-a',
        entryName: 'page-a',
        entryPath: 'html/page-a/index.html',
        isSPA: true,
        isSSR: false,
      },
      {
        urlPath: '/a/page-b',
        entryName: 'page-b',
        entryPath: 'html/page-b/index.html',
        isSPA: true,
        isSSR: false,
      },
      {
        urlPath: '/b/page-a',
        entryName: 'page-a',
        entryPath: 'html/page-a/index.html',
        isSPA: true,
        isSSR: false,
      },
      {
        urlPath: '/b/page-b',
        entryName: 'page-b',
        entryPath: 'html/page-b/index.html',
        isSPA: true,
        isSSR: false,
      },
    ]);
  });

  test(`should use / as main entry route`, () => {
    const routes = getServerRoutes(
      [{ entryName: MAIN_ENTRY_NAME }] as Entrypoint[],
      {
        appContext,
        config: {
          source: sourceConfig,
          output: outputConfig,
          server: serverConfig,
        },
      } as any,
    );

    expect(routes).toMatchObject([
      {
        urlPath: '/',
        entryName: MAIN_ENTRY_NAME,
        entryPath: `html/${MAIN_ENTRY_NAME}/index.html`,
        isSPA: true,
        isSSR: false,
      },
    ]);

    expect(
      getServerRoutes(
        [{ entryName: MAIN_ENTRY_NAME }] as Entrypoint[],
        {
          appContext,
          config: {
            source: sourceConfig,
            output: outputConfig,
            server: {
              ...serverConfig,
              routes: { main: '/test' },
            },
          },
        } as any,
      ),
    ).toMatchObject([
      {
        urlPath: '/test',
        entryName: MAIN_ENTRY_NAME,
        entryPath: `html/${MAIN_ENTRY_NAME}/index.html`,
        isSPA: true,
        isSSR: false,
      },
    ]);
  });

  test(`should support public folder`, () => {
    const fixture = path.resolve(
      __dirname,
      './fixtures/server-routes/has-config',
    );

    const routes = getServerRoutes([{ entryName: 'page-a' }] as Entrypoint[], {
      appContext: { appDirectory: fixture } as IAppContext,
      config: {
        source: sourceConfig,
        output: outputConfig,
        server: {
          ...serverConfig,
          publicRoutes: {
            'wx.txt': '/app/authentication',
          },
        },
      } as any,
    });

    expect(routes).toMatchObject([
      {
        urlPath: '/page-a',
        entryName: 'page-a',
        entryPath: 'html/page-a/index.html',
        isSPA: true,
        isSSR: false,
      },
      {
        urlPath: '/b/about/logo.png',
        entryPath: 'public/b/about/logo.png',
        isSPA: true,
        isSSR: false,
      },
      {
        urlPath: '/b/info.js',
        entryPath: 'public/b/info.js',
        isSPA: true,
        isSSR: false,
      },
      {
        urlPath: '/test.json',
        entryPath: 'public/test.json',
        isSPA: true,
        isSSR: false,
      },
      {
        urlPath: '/app/authentication',
        entryPath: 'public/wx.txt',
        isSPA: true,
        isSSR: false,
      },
    ]);
  });

  test(`should support disable spa`, () => {
    const routes = getServerRoutes(
      [{ entryName: 'page-a' }] as Entrypoint[],
      {
        appContext,
        config: {
          source: sourceConfig,
          output: outputConfig,
          server: {
            ...serverConfig,
            baseUrl: undefined,
            routes: { 'page-a': { disableSpa: true } },
          },
        },
      } as any,
    );

    expect(routes).toMatchObject([
      {
        urlPath: '/page-a',
        entryName: 'page-a',
        entryPath: 'html/page-a',
        isSPA: false,
        isSSR: false,
      },
    ]);
  });
});
