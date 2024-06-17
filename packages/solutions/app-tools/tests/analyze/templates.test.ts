/* eslint-disable @typescript-eslint/no-empty-function */
import { renderFunction } from '../../src/plugins/analyze/templates';

jest.mock('@modern-js/utils', () => {
  const fs = {
    writeFile() {},
    writeJSON() {},
    ensureFile() {},
  };
  return {
    __esModule: true,
    ...jest.requireActual('@modern-js/utils'),
    fs,
  };
});

expect.addSnapshotSerializer({
  test: val => typeof val === 'string',
  print: (val: unknown) => (val as string).replace(/\\/g, '/'),
});

describe('renderFunction', () => {
  test('basic usage', () => {
    const code = renderFunction({
      plugins: [],
      customBootstrap: false,
      fileSystemRoutes: undefined,
    });

    expect(code).toMatchSnapshot();
  });
});
