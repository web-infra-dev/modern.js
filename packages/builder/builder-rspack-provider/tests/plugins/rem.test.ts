import { describe, expect, it } from 'vitest';
import { createBuilder, matchPlugin } from '../helper';
import { builderPluginCss } from '@/plugins/css';
import { builderPluginLess } from '@/plugins/less';
import { builderPluginSass } from '@/plugins/sass';
import { builderPluginRem } from '@/plugins/rem';

describe('plugins/rem', () => {
  it('should not run rem plugin without config', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginCss(), builderPluginRem()],
      builderConfig: {},
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should not run rem plugin when false', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginCss(), builderPluginRem()],
      builderConfig: {
        output: {
          convertToRem: false,
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should run rem plugin with default config', async () => {
    const builder = await createBuilder({
      plugins: [
        builderPluginCss(),
        builderPluginLess(),
        builderPluginSass(),
        builderPluginRem(),
      ],
      builderConfig: {
        output: {
          convertToRem: true,
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should not run htmlPlugin with enableRuntime is false', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginCss(), builderPluginRem()],
      builderConfig: {
        output: {
          convertToRem: {
            enableRuntime: false,
          },
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0].plugins?.length || 0).toBe(0);
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should run rem plugin with custom config', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginCss(), builderPluginRem()],
      builderConfig: {
        output: {
          convertToRem: {
            rootFontSize: 30,
            pxtorem: {
              propList: ['font-size'],
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

  it('should not run rem plugin when target is node', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginCss(), builderPluginRem()],
      builderConfig: {
        output: {
          convertToRem: true,
        },
      },
      target: ['node'],
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(
      matchPlugin(bundlerConfigs[0], 'AutoSetRootFontSizePlugin'),
    ).toBeFalsy();
  });

  it('should not run rem plugin when target is web-worker', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginCss(), builderPluginRem()],
      builderConfig: {
        output: {
          convertToRem: true,
        },
      },
      target: ['web-worker'],
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(
      matchPlugin(bundlerConfigs[0], 'AutoSetRootFontSizePlugin'),
    ).toBeFalsy();
  });
});
