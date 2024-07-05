/**
 * @jest-environment node
 */
import path from 'path';
import { fs } from '@modern-js/utils';
import {
  renderString,
  RenderOptions,
} from '../../src/core/server/index.server';
import { getInitialContext } from '../../src/core/context/runtime';
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
      params: {},
      config: {
        ssr: true,
      },
      onTiming,
    };

    const html = await renderString(request as any, App, renderOptions);

    expect(html).toMatchSnapshot();
    expect(onTiming).toBeCalled();
  });
});
