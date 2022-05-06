import postcss from 'postcss';
import type { Result } from 'postcss';
import getPostcssPlugin from '../src/postcss-plugin';

describe('postcss', () => {
  it('base use', () => {
    const plugin = getPostcssPlugin({ cssVarsHash: { '--warning': 'red' } });
    postcss([plugin])
      .process(
        `
      color: --warning;
    `,
        { from: '', to: undefined },
      )
      .then((result: Result) => {
        expect(result.css).toMatchSnapshot();
      });
  });
});
