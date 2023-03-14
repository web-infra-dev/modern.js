import { describe, it, expect } from 'vitest';
import { createBuilder } from '../helper';
import { builderPluginBabel } from '@/plugins/babel';

describe('plugins/babel', () => {
  it('should set babel-loader', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginBabel()],
      builderConfig: {
        tools: {
          babel: {},
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(JSON.stringify(bundlerConfigs[0])).toMatchSnapshot();
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

    expect(JSON.stringify(bundlerConfigs[0])).toMatchSnapshot();
  });
});
