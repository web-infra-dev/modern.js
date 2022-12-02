import { describe, it, expect } from 'vitest';
import { createBuilder } from '../helper';
import { PluginExternals } from '@/plugins/externals';

describe('plugins/external', () => {
  it('should add external config', async () => {
    const builder = await createBuilder({
      plugins: [PluginExternals()],
      builderConfig: {
        output: {
          externals: {
            react: 'React',
          },
        },
      },
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();
    expect(bundlerConfigs[0].externals).toEqual({
      react: 'React',
    });
  });
});
