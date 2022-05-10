import { formatURL } from '../src/createSocketUrl';

describe('formatURL', () => {
  test('should return correct URL', async () => {
    expect(
      formatURL({
        hostname: 'localhost',
        pathname: '/_modern_js_hmr_ws',
        port: '8080',
        protocol: 'ws',
      }),
    ).toEqual('ws://localhost:8080/_modern_js_hmr_ws');
  });

  test('should return correct URL in legacy browsers', async () => {
    const { URL } = window;
    Object.defineProperty(window, 'URL', {
      value: undefined,
    });

    expect(
      formatURL({
        hostname: 'localhost',
        pathname: '/_modern_js_hmr_ws',
        port: '8080',
        protocol: 'ws',
      }),
    ).toEqual('ws://localhost:8080/_modern_js_hmr_ws');

    Object.defineProperty(window, 'URL', {
      value: URL,
    });
  });
});
