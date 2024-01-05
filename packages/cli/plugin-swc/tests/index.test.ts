import type {
  FnPluginSwcOptions,
  ObjPluginSwcOptions,
} from '@rsbuild/plugin-swc';
import { logger } from '@modern-js/utils/logger';
import { applyBuilderSwcConfig } from '../src';

describe('plugin config', () => {
  it('should enable loadableComponents', () => {
    {
      const config = applyBuilderSwcConfig(
        {},
        undefined,
        true,
      ) as ObjPluginSwcOptions;

      expect(config.extensions!.loadableComponents).toBeTruthy();
    }

    {
      const config = applyBuilderSwcConfig(
        config => {
          expect(config.extensions!.loadableComponents).toBeTruthy();
        },
        undefined,
        true,
      ) as FnPluginSwcOptions;

      config({}, null as any);
    }
  });

  it('should log warning when using swc and esbuild at the same time', () => {
    let count = 0;

    logger.warn = () => {
      count++;
    };

    applyBuilderSwcConfig({}, { minimize: {} }, true) as ObjPluginSwcOptions;

    const config = applyBuilderSwcConfig(
      _config => _config,
      undefined,
      true,
    ) as FnPluginSwcOptions;

    config({}, null as any);

    expect(count).toBe(2);
  });

  it('should not override user extensions config', () => {
    const config = applyBuilderSwcConfig(
      config => {
        config.extensions ??= {};
        config.extensions.emotion = true;
      },
      undefined,
      true,
    ) as FnPluginSwcOptions;

    const finalConfig = config(
      {
        extensions: {
          styledComponents: true,
        },
      },
      null as any,
    )!;

    expect(finalConfig.extensions).toBeDefined();
    expect(finalConfig.extensions!.emotion).toBeDefined();
    expect(finalConfig.extensions!.styledComponents).toBeDefined();
  });
});
