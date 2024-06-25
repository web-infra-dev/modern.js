import { merge } from 'ts-deepmerge';

describe('test loadConfig', () => {
  test('should merge CliConfig and ServerConfig correctly', () => {
    const cliConfig = {
      bff: {
        prefix: '/bff',
      },
      source: {
        envVars: ['VERSION'],
      },
    };

    const serverConfig = {
      bff: {
        proxy: {
          '/api': {
            target: 'https://cnodejs.org',
            pathRewrite: { '/api/topics': '/api/v1/topics' },
            changeOrigin: true,
          },
        },
      },
    };

    const config = merge(cliConfig as any, serverConfig);

    expect(config).toEqual({
      bff: {
        prefix: '/bff',
        proxy: {
          '/api': {
            target: 'https://cnodejs.org',
            pathRewrite: { '/api/topics': '/api/v1/topics' },
            changeOrigin: true,
          },
        },
      },
      source: {
        envVars: ['VERSION'],
      },
    });
  });
});
