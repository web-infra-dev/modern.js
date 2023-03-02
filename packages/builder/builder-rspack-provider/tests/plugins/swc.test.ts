import { describe, expect, it } from 'vitest';
import { BuilderTarget } from '@modern-js/builder-shared';
import { createBuilder } from '../helper';
import { builderPluginSwc } from '@/plugins/swc';
import { BuilderConfig } from '@/types';

describe('plugins/swc', () => {
  it('should disable preset_env in target other than web', async () => {
    await matchConfigSnapshot('node', {
      output: {
        polyfill: 'entry',
      },
    });
  });

  it('should disable preset_env mode', async () => {
    await matchConfigSnapshot('web', {
      output: {
        polyfill: 'off',
      },
    });
  });

  it('should enable usage mode preset_env', async () => {
    await matchConfigSnapshot('web', {
      output: {
        polyfill: 'usage',
      },
    });
  });

  it('should enable entry mode preset_env', async () => {
    await matchConfigSnapshot('web', {
      output: {
        polyfill: 'entry',
      },
    });
  });

  it('should add browserslist', async () => {
    await matchConfigSnapshot('web', {
      output: {
        overrideBrowserslist: ['chrome 98'],
      },
    });

    await matchConfigSnapshot('web', {
      output: {
        overrideBrowserslist: {
          web: ['chrome 98'],
        },
      },
    });
  });

  it("should'n override browserslist when target platform is not web", async () => {
    await matchConfigSnapshot('web', {
      output: {
        overrideBrowserslist: {
          node: ['chrome 98'],
        },
      },
    });
  });

  it('should has correct core-js', async () => {
    await matchConfigSnapshot('web', {
      output: {
        polyfill: 'entry',
      },
    });
  });

  // TODO wait for tools.modularImports
  // it('should add pluginImport', async () => {
  //   await matchConfigSnapshot('web', {
  //     tools: {
  //       swc: {
  //         pluginImport: [
  //           {
  //             libraryName: 'foo',
  //           },
  //         ],
  //       },
  //     },
  //   });
  // });
});

async function matchConfigSnapshot(
  target: BuilderTarget,
  builderConfig: BuilderConfig,
) {
  const builder = await createBuilder({
    target,
    plugins: [builderPluginSwc()],
    builderConfig,
  });

  const {
    origin: { bundlerConfigs },
  } = await builder.inspectConfig();

  expect(bundlerConfigs[0]).toMatchSnapshot();
}
