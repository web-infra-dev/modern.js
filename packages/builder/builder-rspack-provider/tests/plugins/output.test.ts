import { expect, describe, it } from 'vitest';
import { createBuilder } from '../helper';
import { builderPluginOutput } from '@/plugins/output';

describe('plugins/output', () => {
  it('should set output correctly', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginOutput()],
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow to custom server directory with distPath.server', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginOutput()],
      target: ['node'],
      builderConfig: {
        output: {
          distPath: {
            server: 'server',
          },
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow to use filename.js to modify filename', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginOutput()],
      builderConfig: {
        output: {
          filename: {
            js: 'foo.js',
            css: '[name].css',
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
