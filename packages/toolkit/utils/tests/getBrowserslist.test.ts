import path from 'path';
import { getBrowserslist, defaults } from '../src/getBrowserslist';

describe('get browserslist', () => {
  const fixture = path.resolve(__dirname, './fixtures/browserlist');

  test(`should load browserslist from package.json`, () => {
    expect(getBrowserslist(path.join(fixture, 'pkg'))).toEqual([
      'not IE 11',
      'maintained node versions',
    ]);
  });

  test(`should load browerslist from  .browserslistrc`, () => {
    expect(getBrowserslist(path.join(fixture, 'dotfile'))).toEqual([
      'defaults',
      'not IE 11',
      'maintained node versions',
    ]);
  });

  test(`should load browserslist base on environment`, () => {
    process.env.NODE_ENV = 'development';
    expect(getBrowserslist(path.join(fixture, 'develop'))).toEqual([
      'last 1 chrome version',
    ]);
  });

  test(`should return default browserslist config`, () => {
    expect(getBrowserslist(path.join(fixture))).toEqual(defaults);
  });
});
