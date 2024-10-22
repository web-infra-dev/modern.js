import { helmetReplace } from '../../src/core/server/helmet';

const helmetData = {
  bodyAttributes: '',
  htmlAttributes: '',
  base: '',
  link: '',
  meta: '',
  noscript: '',
  script: '',
  style: '',
  title: '',
};

describe('helmet', () => {
  it('should replace title', () => {
    const result = helmetReplace('<title>foo</title>', {
      ...helmetData,
      title: '<title>baz</title>',
    } as any);

    expect(result).toMatch('baz');
  });
});
