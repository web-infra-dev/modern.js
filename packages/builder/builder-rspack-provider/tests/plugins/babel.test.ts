import { describe, it, expect } from 'vitest';
import { createBuilder } from '../helper';
import { builderPluginBabel } from '@/plugins/babel';

describe('plugins/babel', () => {
  it('should set babel-loader', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginBabel()],
      builderConfig: {
        tools: {
          babel(config: any) {
            config.plugins.push([
              'babel-plugin-import',
              {
                libraryName: 'xxx-components',
                libraryDirectory: 'es',
                style: true,
              },
            ]);
          },
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should not set babel-loader when babel config is return null', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginBabel()],
      builderConfig: {
        tools: {
          babel: () => {
            // do nothing
          },
        } as any,
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should not set babel-loader when babel config is null', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginBabel()],
      builderConfig: {
        tools: {
          babel: {},
        } as any,
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should not set babel-loader', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginBabel()],
      builderConfig: {
        tools: {},
      },
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});
