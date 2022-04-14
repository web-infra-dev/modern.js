import * as path from 'path';
import type { NormalizedConfig } from '@modern-js/core';
import { DEFAULT_SERVER_CONFIG } from '@modern-js/utils';
import mergeDeep from 'merge-deep';
import { getServerConfigPath } from '../src/libs/loadConfig';

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

    const config = mergeDeep(
      cliConfig as unknown as NormalizedConfig,
      serverConfig,
    );

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

  test('should get server config path correctly', () => {
    const distDirectory = path.normalize(
      '/Users/user/project/local-test-project/dist',
    );
    const serverConfigFile = DEFAULT_SERVER_CONFIG;
    const serverConfigPath = path.normalize(
      `/Users/user/project/local-test-project/dist/${DEFAULT_SERVER_CONFIG}.js`,
    );

    expect(getServerConfigPath(distDirectory, serverConfigFile)).toEqual(
      serverConfigPath,
    );
  });
});
