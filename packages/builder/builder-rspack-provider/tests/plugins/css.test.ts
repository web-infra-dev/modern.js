import { expect, describe, it } from 'vitest';
import { createBuilder } from '../helper';
import { PluginCss } from '@/plugins/css';

describe('plugins/css', () => {
  it('should override browserslist of autoprefixer when using output.overrideBrowserslist config', async () => {
    const builder = await createBuilder({
      plugins: [PluginCss()],
      builderConfig: {
        output: {
          overrideBrowserslist: ['Chrome 80'],
        },
      },
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should disable source map when output.disableSourceMap is true', async () => {
    const builder = await createBuilder({
      plugins: [PluginCss()],
      builderConfig: {
        output: {
          disableSourceMap: true,
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(JSON.stringify(bundlerConfigs[0])).toContain('"sourceMap":false');
  });

  it('should disable source map when output.disableSourceMap is css: true', async () => {
    const builder = await createBuilder({
      plugins: [PluginCss()],
      builderConfig: {
        output: {
          disableSourceMap: {
            css: true,
          },
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(JSON.stringify(bundlerConfigs[0])).toContain('"sourceMap":false');
  });

  it('should disable source map in production by default', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const builder = await createBuilder({
      plugins: [PluginCss()],
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(JSON.stringify(bundlerConfigs[0])).toContain('"sourceMap":false');

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should allow to custom cssModuleLocalIdentName', async () => {
    const builder = await createBuilder({
      plugins: [PluginCss()],
      builderConfig: {
        output: {
          cssModuleLocalIdentName: '[hash:base64]',
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(JSON.stringify(bundlerConfigs[0])).toContain(
      '"generateScopedName":"[hash:base64]"',
    );
  });
});
