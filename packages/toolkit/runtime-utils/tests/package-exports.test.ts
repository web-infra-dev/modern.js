import { readFileSync } from 'node:fs';

const pkg = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf-8'),
);

describe('package exports', () => {
  test('should expose router to both ESM import and CJS require', () => {
    const routerExport = pkg.exports['./router'];

    expect(routerExport).toMatchObject({
      types: './dist/types/router.d.ts',
      import: './dist/esm/router.mjs',
      require: './dist/cjs/router.js',
      default: './dist/esm/router.mjs',
    });
  });
});
