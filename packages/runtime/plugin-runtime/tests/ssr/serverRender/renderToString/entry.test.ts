import Entry from '../../../../src/ssr/serverRender/renderToString/entry';

describe('Entry', () => {
  it('should inject inline json correctly', () => {
    const entry: any = new Entry({
      config: { inlineScript: false },
      ctx: {
        template: '',
        request: {},
      },
    } as any);
    expect(
      entry.getSSRDataScript({ name: 'modern.js' }, { age: 18 }),
    ).toMatchSnapshot();
  });

  it('should inject inline scripts with nonce correctly', () => {
    const entry: any = new Entry({
      config: { inlineScript: true },
      ctx: {
        template: '',
        request: {},
        nonce: 'test-nonce',
      },
    } as any);
    expect(
      entry.getSSRDataScript({ name: 'modern.js' }, { age: 18 }),
    ).toMatchSnapshot();
  });

  it('should inject inline script correctly', () => {
    const entry: any = new Entry({
      config: { inlineScript: true },
      ctx: {
        template: '',
        request: {},
      },
    } as any);
    expect(
      entry.getSSRDataScript({ name: 'modern.js' }, { age: 18 }),
    ).toMatchSnapshot();
  });
});
