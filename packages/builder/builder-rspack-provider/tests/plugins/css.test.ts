import { expect, describe, it } from 'vitest';
import { createBuilder } from '../helper';
import { builderPluginCss } from '@/plugins/css';
import { builderPluginLess } from '@/plugins/less';
import { builderPluginSass } from '@/plugins/sass';

describe('plugins/css', () => {
  it('should override browserslist of autoprefixer when using output.overrideBrowserslist config', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginCss()],
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
      plugins: [builderPluginCss()],
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
      plugins: [builderPluginCss()],
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
      plugins: [builderPluginCss()],
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(JSON.stringify(bundlerConfigs[0])).toContain('"sourceMap":false');

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should allow to custom cssModuleLocalIdentName', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginCss()],
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

describe('plugins/less', () => {
  it('should add less-loader', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginLess()],
      builderConfig: {
        tools: {
          less: {},
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should add less-loader with tools.less', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginLess()],
      builderConfig: {
        tools: {
          less: {
            lessOptions: {
              javascriptEnabled: false,
            },
          },
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should add less-loader with excludes', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginLess()],
      builderConfig: {
        tools: {
          less(config, { addExcludes }) {
            addExcludes(/node_modules/);
          },
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});

describe('plugins/sass', () => {
  it('should add sass-loader', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginSass()],
      builderConfig: {
        tools: {},
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should add sass-loader with excludes', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginSass()],
      builderConfig: {
        tools: {
          sass(config, { addExcludes }) {
            addExcludes(/node_modules/);
          },
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});
