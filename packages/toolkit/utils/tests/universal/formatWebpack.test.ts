import { addErrorTips } from '../../src/universal/formatWebpack';

describe('addErrorTips', () => {
  test('Should format "You may need an appropriate loader" for TypeScript files', () => {
    expect(
      addErrorTips([
        `File: ./node_modules/foo/index.ts
Module parse failed: Unexpected token (1:14)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
> export const a: string = 1;
`,
      ]),
    ).toMatchSnapshot();
  });

  test('Should not format "You may need an appropriate loader" for non-TypeScript files', () => {
    expect(
      addErrorTips([
        `File: ./node_modules/foo/index.foo
Module parse failed: Unexpected token (1:14)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
> export const a: string = 1;
`,
      ]),
    ).toMatchSnapshot();
  });
});
