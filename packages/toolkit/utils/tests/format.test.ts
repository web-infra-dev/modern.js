import { formatProxyOptions } from '../src/format';

describe('test format', () => {
  it('should format correctly use simply options', async () => {
    const proxy = {
      '/simple': `http://localhost`,
    };

    const options = formatProxyOptions(proxy);
    expect(options).toEqual([
      {
        context: '/simple',
        changeOrigin: true,
        logLevel: 'warn',
        target: 'http://localhost',
      },
    ]);
  });

  it('should format correctly use simply options', async () => {
    const proxy = {
      '/simple-obj': {
        target: `http://localhost`,
      },
    };
    const options = formatProxyOptions(proxy);
    expect(options).toEqual([
      {
        context: '/simple-obj',
        changeOrigin: true,
        logLevel: 'warn',
        target: 'http://localhost',
      },
    ]);
  });

  it('should format correctly use simply options', async () => {
    const proxy = {
      context: '/context',
      target: `http://localhost`,
    };
    const options = formatProxyOptions(proxy);
    expect(options).toEqual([
      { context: '/context', target: 'http://localhost' },
    ]);
  });

  it('should format correctly use simply options', async () => {
    const proxy = [
      {
        context: '/array',
        target: `http://localhost`,
      },
    ];
    const options = formatProxyOptions(proxy);
    expect(options).toEqual([
      { context: '/array', target: 'http://localhost' },
    ]);
  });
});
