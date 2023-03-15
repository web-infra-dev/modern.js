import plugin from '../../src/ssr';
import cliPlugin from '../../src/ssr/cli';
import { formatClient, isCrossOrigin, formatServer } from '../../src/ssr/utils';
import { time } from '../../src/ssr/serverRender/time';

describe('plugin-ssr', () => {
  it('default', () => {
    expect(plugin).toBeDefined();
    expect(cliPlugin).toBeDefined();
  });

  it('should time work correctly', async () => {
    const end = time();
    await new Promise((resolve, _reject) => {
      setTimeout(() => {
        resolve(null);
      }, 1000);
    });
    const cost = end();
    expect(typeof cost === 'number').toBeTruthy();
  });

  it('should format work correctly', () => {
    const request = {
      params: {},
      host: 'modernjs.com',
      pathname: '/pathname',
      query: {},
      headers: {
        cookie: 'header-cookie',
      },
      cookieMap: {},
    };

    Object.defineProperty(document, 'cookie', {
      get() {
        return 'header-cookie-client';
      },
    });
    expect(formatClient(request)).toEqual({
      ...request,
      referer: '',
      cookie: 'header-cookie-client',
      url: 'http://localhost/',
      userAgent: `Mozilla/5.0 (${process.platform}) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/20.0.3`,
    });

    expect(formatServer(request)).toEqual({
      ...request,
      referer: undefined,
      cookie: 'header-cookie',
      userAgent: '',
    });
  });

  it('should detect cross origin correctly', () => {
    const result_0 = isCrossOrigin('/static/js/index.js', 'modernjs.com');
    const result_1 = isCrossOrigin('./static/js/index.js', 'modernjs.com');
    const result_2 = isCrossOrigin(
      'http://modernjs.com/static/js/index.js',
      'modernjs.com',
    );
    const result_3 = isCrossOrigin(
      'http://modernjs1.com/static/js/index.js',
      'modernjs.com',
    );
    expect(result_0).toBeFalsy();
    expect(result_1).toBeFalsy();
    expect(result_2).toBeFalsy();
    expect(result_3).toBeTruthy();
  });
});
