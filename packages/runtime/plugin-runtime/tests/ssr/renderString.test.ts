/**
 * @jest-environment node
 */
import path from 'path';
import { fs, createLogger } from '@modern-js/utils';
import React from 'react';
import { renderString, RenderOptions } from '../../src/core/server/server';
import { getInitialContext } from '../../src/core/context/runtime';
import { wrapRuntimeContextProvider } from '../../src/core/react/wrapper';
import App from './fixtures/string-ssr/App';

const htmlPath = path.resolve(
  __dirname,
  './fixtures/htmlTemplate/template.html',
);

const onTiming = jest.fn();

describe('test render', () => {
  it('should render styledComponent correctly', async () => {
    const htmlTemplate = fs.readFileSync(htmlPath, 'utf8');

    const runtimeContext = getInitialContext({} as any, false);

    class Request {
      url: string;

      headers: Map<string, string | undefined> = new Map();

      constructor(url: string) {
        this.url = url;
      }
    }
    const request = new Request('http://localhost:8080');

    runtimeContext.ssrContext = {
      redirection: {},
      htmlModifiers: [],
      request: {
        url: 'http://localhost:8080',
        userAgent: request.headers.get('user-agent')!,
        raw: request as any,
      } as any,
      response: {
        setHeader() {
          // ignore
        },
        status() {
          // ignore
        },
        locals: {},
      },
      mode: 'string',
    } as any;

    const renderOptions: RenderOptions = {
      runtimeContext,
      resource: {
        loadableStats: {},
        route: {
          urlPath: '/',
          entryPath: 'main',
        },
        htmlTemplate,
        entryName: 'main',
        routeManifest: {} as any,
      },
      loaderContext: new Map(),
      logger: createLogger(),
      params: {},
      config: {
        ssr: true,
      },
      onTiming,
    };

    const serverRoot = wrapRuntimeContextProvider(React.createElement(App), {
      ssr: true,
    } as any);

    const html = await renderString(request as any, serverRoot, renderOptions);

    expect(html).toMatchSnapshot();
    expect(onTiming).toBeCalled();
  });
});
