import helmet from '../src/serverRender/helmet';

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
    const result = helmet('<title>foo</title>', {
      ...helmetData,
      title: 'baz',
    } as any);

    expect(result).toMatch('baz');
  });
});
