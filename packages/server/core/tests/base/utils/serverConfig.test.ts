import * as path from 'path';
import { DEFAULT_SERVER_CONFIG } from '@modern-js/utils';
import mergeDeep from 'merge-deep';
import { getServerConfigPath } from '../../../src/base/utils';

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

    const config = mergeDeep(cliConfig as any, serverConfig);

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

  test('should get server config path correctly', async () => {
    const distDirectory = path.normalize(
      '/Users/user/project/local-test-project/dist',
    );
    const serverConfigFile = DEFAULT_SERVER_CONFIG;
    const serverConfigPath = path.normalize(
      `/Users/user/project/local-test-project/dist/${DEFAULT_SERVER_CONFIG}.js`,
    );

    const serverConf = await getServerConfigPath(
      distDirectory,
      serverConfigFile,
    );

    expect(serverConf).toEqual(serverConfigPath);
  });
});
