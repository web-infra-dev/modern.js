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

    const renderOptions: RenderOptions = {
      runtimeContext: getInitialContext({} as any, false),
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
      config: {},
      onTiming,
    };

    class Request {
      url: string;

      headers: Map<string, string | undefined> = new Map();

      constructor(url: string) {
        this.url = url;
      }
    }
    const request = new Request('http://localhost:8080');

    const html = await renderString(request as any, App, renderOptions);

    expect(html).toMatchSnapshot();
    expect(onTiming).toBeCalled();
  });
});
