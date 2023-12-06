import { expect, describe, it } from 'vitest';
import { createBuilder } from '../helper';
import { builderPluginMinimize } from '@/plugins/minimize';

describe('plugins/minimize', () => {
  it('should not apply minimizer in development', async () => {
    process.env.NODE_ENV = 'development';

    const builder = await createBuilder({
      plugins: [builderPluginMinimize()],
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0].optimization?.minimize).toEqual(false);
    expect(bundlerConfigs[0].optimization?.minimizer).toBeUndefined();

    process.env.NODE_ENV = 'test';
  });

  it('should apply minimizer in production', async () => {
    process.env.NODE_ENV = 'production';

    const builder = await createBuilder({
      plugins: [builderPluginMinimize()],
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0].optimization?.minimize).toEqual(true);

    expect(bundlerConfigs[0].optimization?.minimizer).toMatchInlineSnapshot(
      `
      [
        SwcJsMinimizerRspackPlugin {
          "_options": {
            "compress": "{\\"passes\\":1,\\"pure_funcs\\":[],\\"drop_console\\":false}",
            "exclude": undefined,
            "extractComments": "true",
            "format": "{\\"comments\\":false,\\"asciiOnly\\":true}",
            "include": undefined,
            "mangle": "{\\"keep_classnames\\":false,\\"keep_fnames\\":false}",
            "module": undefined,
            "test": undefined,
          },
          "name": "SwcJsMinimizerRspackPlugin",
        },
        CssMinimizerPlugin {
          "options": {
            "exclude": undefined,
            "include": undefined,
            "minimizer": {
              "implementation": [Function],
              "options": {
                "preset": [
                  "default",
                  {
                    "mergeLonghand": false,
                  },
                ],
              },
            },
            "parallel": true,
            "test": /\\\\\\.css\\(\\\\\\?\\.\\*\\)\\?\\$/i,
            "warningsFilter": [Function],
          },
        },
      ]
    `,
    );

    process.env.NODE_ENV = 'test';
  });

  it('should not apply minimizer when output.disableMinimize is true', async () => {
    process.env.NODE_ENV = 'production';

    const builder = await createBuilder({
      plugins: [builderPluginMinimize()],
      builderConfig: {
        output: {
          disableMinimize: true,
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0].optimization?.minimize).toEqual(false);

    process.env.NODE_ENV = 'test';
  });

  it('should dropConsole when performance.removeConsole is true', async () => {
    process.env.NODE_ENV = 'production';

    const builder = await createBuilder({
      plugins: [builderPluginMinimize()],
      builderConfig: {
        performance: {
          removeConsole: true,
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0].optimization?.minimizer).toMatchInlineSnapshot(
      `
      [
        SwcJsMinimizerRspackPlugin {
          "_options": {
            "compress": "{\\"passes\\":1,\\"pure_funcs\\":[],\\"drop_console\\":true}",
            "exclude": undefined,
            "extractComments": "true",
            "format": "{\\"comments\\":false,\\"asciiOnly\\":true}",
            "include": undefined,
            "mangle": "{\\"keep_classnames\\":false,\\"keep_fnames\\":false}",
            "module": undefined,
            "test": undefined,
          },
          "name": "SwcJsMinimizerRspackPlugin",
        },
        CssMinimizerPlugin {
          "options": {
            "exclude": undefined,
            "include": undefined,
            "minimizer": {
              "implementation": [Function],
              "options": {
                "preset": [
                  "default",
                  {
                    "mergeLonghand": false,
                  },
                ],
              },
            },
            "parallel": true,
            "test": /\\\\\\.css\\(\\\\\\?\\.\\*\\)\\?\\$/i,
            "warningsFilter": [Function],
          },
        },
      ]
    `,
    );

    process.env.NODE_ENV = 'test';
  });

  it('should remove specific console when performance.removeConsole is array', async () => {
    process.env.NODE_ENV = 'production';

    const builder = await createBuilder({
      plugins: [builderPluginMinimize()],
      builderConfig: {
        performance: {
          removeConsole: ['log', 'warn'],
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0].optimization?.minimizer).toMatchInlineSnapshot(
      `
      [
        SwcJsMinimizerRspackPlugin {
          "_options": {
            "compress": "{\\"passes\\":1,\\"pure_funcs\\":[\\"console.log\\",\\"console.warn\\"],\\"drop_console\\":false}",
            "exclude": undefined,
            "extractComments": "true",
            "format": "{\\"comments\\":false,\\"asciiOnly\\":true}",
            "include": undefined,
            "mangle": "{\\"keep_classnames\\":false,\\"keep_fnames\\":false}",
            "module": undefined,
            "test": undefined,
          },
          "name": "SwcJsMinimizerRspackPlugin",
        },
        CssMinimizerPlugin {
          "options": {
            "exclude": undefined,
            "include": undefined,
            "minimizer": {
              "implementation": [Function],
              "options": {
                "preset": [
                  "default",
                  {
                    "mergeLonghand": false,
                  },
                ],
              },
            },
            "parallel": true,
            "test": /\\\\\\.css\\(\\\\\\?\\.\\*\\)\\?\\$/i,
            "warningsFilter": [Function],
          },
        },
      ]
    `,
    );

    process.env.NODE_ENV = 'test';
  });

  it('should set asciiOnly false when output.charset is utf8', async () => {
    process.env.NODE_ENV = 'production';

    const builder = await createBuilder({
      plugins: [builderPluginMinimize()],
      builderConfig: {
        output: {
          charset: 'utf8',
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0].optimization?.minimizer).toMatchInlineSnapshot(
      `
      [
        SwcJsMinimizerRspackPlugin {
          "_options": {
            "compress": "{\\"passes\\":1,\\"pure_funcs\\":[],\\"drop_console\\":false}",
            "exclude": undefined,
            "extractComments": "true",
            "format": "{\\"comments\\":false,\\"asciiOnly\\":false}",
            "include": undefined,
            "mangle": "{\\"keep_classnames\\":false,\\"keep_fnames\\":false}",
            "module": undefined,
            "test": undefined,
          },
          "name": "SwcJsMinimizerRspackPlugin",
        },
        CssMinimizerPlugin {
          "options": {
            "exclude": undefined,
            "include": undefined,
            "minimizer": {
              "implementation": [Function],
              "options": {
                "preset": [
                  "default",
                  {
                    "mergeLonghand": false,
                  },
                ],
              },
            },
            "parallel": true,
            "test": /\\\\\\.css\\(\\\\\\?\\.\\*\\)\\?\\$/i,
            "warningsFilter": [Function],
          },
        },
      ]
    `,
    );

    process.env.NODE_ENV = 'test';
  });
});
