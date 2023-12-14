import { expect, describe, it } from 'vitest';
import { createUniBuilder } from '../src';
import { matchPlugins, unwrapConfig } from './helper';

describe('plugin-sri', () => {
  it('should apply default sri plugin', async () => {
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      config: {
        security: {
          sri: true,
        },
      },
    });

    const config = await unwrapConfig(rsbuild);
    expect(config.output?.crossOriginLoading).toBe('anonymous');

    expect(matchPlugins(config, 'SubresourceIntegrityPlugin'))
      .toMatchInlineSnapshot(`
      [
        SubresourceIntegrityPlugin {
          "options": {
            "enabled": "auto",
            "hashFuncNames": [
              "sha384",
            ],
            "hashLoading": "eager",
          },
          "setup": [Function],
          "validateHashFuncName": [Function],
          "validateHashFuncNames": [Function],
          "validateHashLoading": [Function],
          "validateOptions": [Function],
          "warnStandardHashFunc": [Function],
        },
      ]
    `);
  });

  it('should apply sri plugin', async () => {
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      config: {
        security: {
          sri: {
            hashFuncNames: ['sha384'],
            enabled: true,
          },
        },
      },
    });

    const config = await unwrapConfig(rsbuild);
    expect(config.output?.crossOriginLoading).toBe('anonymous');

    expect(matchPlugins(config, 'SubresourceIntegrityPlugin'))
      .toMatchInlineSnapshot(`
      [
        SubresourceIntegrityPlugin {
          "options": {
            "enabled": true,
            "hashFuncNames": [
              "sha384",
            ],
            "hashLoading": "eager",
          },
          "setup": [Function],
          "validateHashFuncName": [Function],
          "validateHashFuncNames": [Function],
          "validateHashLoading": [Function],
          "validateOptions": [Function],
          "warnStandardHashFunc": [Function],
        },
      ]
    `);
  });
});
