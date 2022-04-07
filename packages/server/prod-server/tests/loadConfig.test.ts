import * as path from 'path';
import type { NormalizedConfig } from '@modern-js/core';
import { mergeConfig, getServerConfigPath } from '../src/libs/loadConfig';

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

    const config = mergeConfig(
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
    const appDirectory = path.normalize(
      '/Users/user/project/local-test-project',
    );
    const serverConfigFile = 'modern.server.config';
    const serverConfigPath = path.normalize(
      '/Users/user/project/local-test-project/node_modules/.node-bundle-require/modern.server.config.js',
    );

    expect(getServerConfigPath(appDirectory, serverConfigFile)).toEqual(
      serverConfigPath,
    );
  });
});
