import { formatProxyOptions } from '../src/libs/proxy';

describe('test format', () => {
  it('should format correctly use simply options', async () => {
    const options = formatProxyOptions({
      '/simple': `http://localhost`,
    });
    expect(options).toEqual([
      {
        context: '/simple',
        changeOrigin: true,
        logLevel: 'warn',
        target: 'http://localhost',
        onError: expect.any(Function),
      },
    ]);
  });

  it('should format correctly use simply options', async () => {
    const options = formatProxyOptions({
      '/simple-obj': {
        target: `http://localhost`,
      },
    });
    expect(options).toEqual([
      {
        context: '/simple-obj',
        changeOrigin: true,
        logLevel: 'warn',
        target: 'http://localhost',
        onError: expect.any(Function),
      },
    ]);
  });

  it('should format correctly use simply options', async () => {
    const options = formatProxyOptions({
      context: '/context',
      target: `http://localhost`,
    });
    expect(options).toEqual([
      {
        context: '/context',
        target: 'http://localhost',
        onError: expect.any(Function),
      },
    ]);
  });

  it('should format correctly use simply options', async () => {
    const options = formatProxyOptions([
      {
        context: '/array',
        target: `http://localhost`,
      },
    ]);
    expect(options).toEqual([
      {
        context: '/array',
        target: 'http://localhost',
        onError: expect.any(Function),
      },
    ]);
  });
});
