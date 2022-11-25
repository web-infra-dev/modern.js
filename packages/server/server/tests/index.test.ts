/**
 * @jest-environment jsdom
 */
import { formatURL } from '../src/dev-tools/dev-middleware/hmr-client/createSocketUrl';

describe('formatURL', () => {
  test('should return correct URL', async () => {
    expect(
      formatURL({
        hostname: 'localhost',
        pathname: '/webpack-hmr',
        port: '8080',
        protocol: 'ws',
      }),
    ).toEqual('ws://localhost:8080/webpack-hmr');
  });

  test('should return correct URL in legacy browsers', async () => {
    const { URL } = window;
    Object.defineProperty(window, 'URL', {
      value: undefined,
    });

    expect(
      formatURL({
        hostname: 'localhost',
        pathname: '/webpack-hmr',
        port: '8080',
        protocol: 'ws',
      }),
    ).toEqual('ws://localhost:8080/webpack-hmr');

    Object.defineProperty(window, 'URL', {
      value: URL,
    });
  });
});
