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
      // eslint-disable-next-line promise/prefer-await-to-then
      .then((result: Result) => {
        expect(result.css).toMatchSnapshot();
      });
  });
});
