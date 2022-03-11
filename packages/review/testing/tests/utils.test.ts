import { getModuleNameMapper } from '../src/utils';

expect.addSnapshotSerializer({
  test: val => typeof val === 'string' && val.includes('\\'),
  print: val =>
    `"${typeof val === 'string' ? val.replace(/\\/g, '/') : (val as string)}"`,
});

describe('utils', () => {
  test('getModuleNameMapper', () => {
    const mockAlias = {
      '@modern-js/runtime$':
        '/modern.js/tests/integration/api-service-koa/node_modules/.modern-js/.runtime-exports/index.js',
      '@modern-js/runtime/plugins':
        '/modern.js/tests/integration/api-service-koa/node_modules/.modern-js/.runtime-exports/plugins.js',
      '@modern-js/runtime/testing':
        '/modern.js/tests/integration/api-service-koa/node_modules/.modern-js/.runtime-exports/testing.js',
      '@modern-js/runtime/server':
        './node_modules/.modern-js/.runtime-exports/server.js',
    };

    const result = getModuleNameMapper(mockAlias);

    expect(result).toMatchSnapshot();
  });
});
