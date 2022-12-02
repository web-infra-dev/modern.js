import { expect, describe, it } from 'vitest';
import { createBuilder } from '../helper';

describe('applyDefaultPlugins', () => {
  it('should apply default plugins correctly', async () => {
    const builder = await createBuilder({});

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should apply default plugins correctly when prod', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const builder = await createBuilder({});

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();
    expect(bundlerConfigs[0]).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });
});
