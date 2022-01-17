import { transformSync } from '../src';

describe('@modern-js/esbuild-compiler', () => {
  it('default', () => {
    expect(transformSync).toBeInstanceOf(Function);
  });
});
